from transformers import pipeline
import logging
import sys
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', 
                   handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

def load_classifier(model_name="facebook/bart-large-mnli"):
    """Load the zero-shot classification model."""
    try:
        print("Loading classifier model...")
        return pipeline("zero-shot-classification", model=model_name)
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

def classify_query(classifier, query, labels, hypothesis_template=None, multi_label=False):
    """Classify a query using zero-shot classification."""
    try:
        if hypothesis_template:
            result = classifier(query, candidate_labels=labels, hypothesis_template=hypothesis_template, multi_label=multi_label)
        else:
            result = classifier(query, candidate_labels=labels, multi_label=multi_label)
        return result
    except Exception as e:
        logger.error(f"Error during classification: {e}")
        raise

def is_corporate_related(query, classifier, confidence_threshold=0.45):
    """Determine if the query is related to corporate or employee data using multiple checks."""
    try:
        # Clean and normalize the query
        query = query.strip()
        
        # Define broader more specific categories
        corporate_labels = [
            "employee data request", 
            "hr question", 
            "corporate policy",
            "business operations",
            "performance metrics",
            "company data"
        ]
        
        non_corporate_labels = [
            "personal question",
            "entertainment topic",
            "food and recipes",
            "general knowledge",
            "lifestyle question",
            "inappropriate content"
        ]
        
        # Combined labels for classification
        all_labels = corporate_labels + non_corporate_labels
        
        # Enhanced check for obviously non-corporate keywords
        non_corporate_keywords = {
            "inappropriate": ["sex", "porn", "nude", "tinder", "girlfriend", "boyfriend", "marry"],
            "entertainment": ["joke", "movie", "game", "play", "music", "song", "concert", "netflix"],
            "food": ["pancake", "recipe", "food", "cook", "restaurant", "meal", "dinner", "lunch", "breakfast"],
            "lifestyle": ["vacation", "hobby", "garden", "pet", "dog", "cat"]
        }
        
        # Check for non-corporate keywords
        for category, keywords in non_corporate_keywords.items():
            for keyword in keywords:
                if re.search(r'\b' + keyword + r'\b', query.lower()):
                    logger.info(f"Rejected query with non-corporate keyword '{keyword}' in category '{category}'")
                    return False, f"{category} question", 1.0, {f"{category} question": 1.0}
        
        # First classification: corporate vs non-corporate
        domain_result = classify_query(
            classifier,
            query,
            ["corporate business query", "non-corporate personal query"],
            hypothesis_template="This is a {}"
        )
        
        # Extract domain classification results
        domain_label = domain_result['labels'][0]
        domain_score = domain_result['scores'][0]
        
        # If high confidence that it's non-corporate, reject immediately
        if domain_label == "non-corporate personal query" and domain_score >= 0.70:
            logger.info(f"Rejected query as non-corporate with confidence {domain_score:.2f}")
            return False, "non-corporate query", domain_score, {"non-corporate query": domain_score}
        
        # Second classification: specific topic
        result = classify_query(
            classifier, 
            query, 
            all_labels, 
            hypothesis_template="This query is about {}",
            multi_label=True
        )
        
        # Get all scores
        scores = {label: score for label, score in zip(result['labels'], result['scores'])}
        
        # Corporate keyword detection (stronger signals)
        corporate_keywords = [
            "employee", "staff", "personnel", "department", "hr", "company", 
            "corporate", "business", "organization", "management", "team", 
            "performance", "review", "salary", "policy", "finance", "budget"
        ]
        
        # Check if there are explicit corporate keywords
        has_corporate_keywords = any(keyword in query.lower() for keyword in corporate_keywords)
        
        # Get highest scores for corporate and non-corporate categories
        highest_corporate_score = max([scores.get(label, 0) for label in corporate_labels])
        highest_non_corporate_score = max([scores.get(label, 0) for label in non_corporate_labels])
        
        # Get predicted label and confidence
        predicted_label = result['labels'][0]
        confidence = result['scores'][0]
        
        # Decision logic with enhanced rules
        is_corporate = False
        
        # Case 1: Strong corporate keyword presence with reasonable score
        if has_corporate_keywords and highest_corporate_score >= 0.35:
            is_corporate = True
            # Find the actual highest corporate label
            for label in corporate_labels:
                if scores.get(label, 0) == highest_corporate_score:
                    predicted_label = label
                    confidence = highest_corporate_score
                    break
        
        # Case 2: Corporate score significantly higher than non-corporate
        elif highest_corporate_score > highest_non_corporate_score + 0.15:
            is_corporate = True
            # Find the actual highest corporate label
            for label in corporate_labels:
                if scores.get(label, 0) == highest_corporate_score:
                    predicted_label = label
                    confidence = highest_corporate_score
                    break
        
        # Case 3: Standard threshold for corporate labels
        elif predicted_label in corporate_labels and confidence >= confidence_threshold:
            is_corporate = True
        
        # Additional check: if domain classification is strongly corporate, give benefit of doubt
        if not is_corporate and domain_label == "corporate business query" and domain_score >= 0.80:
            is_corporate = True
            predicted_label = "business operations"  # Default to a general business category
            confidence = domain_score
        
        logger.info(f"Classification result: corporate={is_corporate}, label={predicted_label}, confidence={confidence:.2f}")
        logger.debug(f"All scores: {scores}")
        
        return is_corporate, predicted_label, confidence, scores
    
    except Exception as e:
        logger.error(f"Error in corporate relevance check: {e}")
        raise

def process_result(is_related, predicted_label, confidence):
    """Process and display classification results."""
    print(f"Prediction: {predicted_label} (confidence: {confidence:.2f})")
    
    if is_related:
        print("✅ Corporate/Business query - Generate response")
        return True
    else:
        print("❌ Non-corporate query - Do not respond")
        return False

def test_examples(classifier):
    """Test the classifier with various examples."""
    test_queries = [
        # Clear non-corporate queries
        "Tell me about sex",
        "How to make pancakes",
        "Tell me a joke about programming",
        "What movies are playing this weekend",
        "How do I train my dog",
        
        # Clear corporate queries
        "Show me employees who joined after 2022",
        "What departments have the most employees?",
        "List HR policy violations",
        "What is our company's profit margin this quarter?",
        "Who has the most training sessions completed?",
        
        # Borderline or ambiguous queries
        "What is the gender distribution in Engineering?",
        "Tell me about work-life balance",
        "How do I file a complaint?",
        "What are the office hours?",
        "Can I get information about employee benefits?"
    ]
    
    print("\n===== TESTING VARIOUS QUERIES =====")
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        is_corporate, predicted_label, confidence, scores = is_corporate_related(query, classifier)
        
        # Display top 3 scores for this query
        print("Top classification scores:")
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        for label, score in sorted_scores[:3]:
            print(f"  {label}: {score:.2f}")
        
        response_status = "✅ CORPORATE" if is_corporate else "❌ NON-CORPORATE"
        print(f"Result: {response_status} - {predicted_label} ({confidence:.2f})")
    
    print("\n===== END OF TEST =====")

def main():
    try:
        # Load zero-shot classifier
        classifier = load_classifier()
        
        # Run test examples
        test_examples(classifier)
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
