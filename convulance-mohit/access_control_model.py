from transformers import pipeline
import logging
import sys
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', 
                   handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

# Department list based on the unique departments in the dataset
DEPARTMENTS = [
    "Product Management", "Support", "Marketing", "Engineering", "Training",
    "Research and Development", "Services", "Human Resources", "Accounting", 
    "Legal", "Business Development", "Sales"
]

# Department name mapping for common variations and abbreviations
DEPARTMENT_MAPPING = {
    "hr": "Human Resources",
    "human resources": "Human Resources",
    "r&d": "Research and Development",
    "research": "Research and Development",
    "research & development": "Research and Development",
    "research and development": "Research and Development",
    "eng": "Engineering",
    "dev": "Engineering",
    "development": "Engineering",
    "product": "Product Management",
    "product mgmt": "Product Management",
    "pm": "Product Management",
    "sales": "Sales",
    "marketing": "Marketing",
    "legal": "Legal",
    "law": "Legal",
    "accounting": "Accounting",
    "finance": "Accounting",
    "business": "Business Development",
    "business dev": "Business Development",
    "bd": "Business Development",
    "support": "Support",
    "customer support": "Support",
    "services": "Services",
    "training": "Training"
}

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

def extract_requested_department(query):
    """Extract the department name from a query.
    
    Args:
        query (str): The user query
        
    Returns:
        str or None: The standardized department name or None if no department found
    """
    try:
        # Clean and normalize query
        query = query.lower().strip()
        
        # First, check for direct department mentions using the mapping
        for dept_variant, standard_name in DEPARTMENT_MAPPING.items():
            pattern = r'\b' + re.escape(dept_variant) + r'\b'
            if re.search(pattern, query):
                logger.info(f"Found department mention: {standard_name}")
                return standard_name
        
        # If no direct match, try classification approach for department detection
        department_indicators = [
            (r'\bdata\s+from\s+(\w+\s*\w*)\b', 1),
            (r'\bget\s+(\w+\s*\w*)\s+information\b', 1),
            (r'\baccess\s+to\s+(\w+\s*\w*)\b', 1),
            (r'\b(\w+\s*\w*)\s+department\b', 1),
            (r'\b(\w+\s*\w*)\s+team\b', 1),
            (r'\bfrom\s+(\w+\s*\w*)\s+department\b', 1),
            (r'\bfor\s+(\w+\s*\w*)\s+department\b', 1)
        ]
        
        potential_departments = []
        
        for pattern, group in department_indicators:
            matches = re.finditer(pattern, query)
            for match in matches:
                try:
                    dept = match.group(group).strip()
                    if dept:
                        # Check if this extracted term maps to a known department
                        if dept.lower() in DEPARTMENT_MAPPING:
                            potential_departments.append(DEPARTMENT_MAPPING[dept.lower()])
                        # Try partial matching
                        else:
                            for known_dept, standard_name in DEPARTMENT_MAPPING.items():
                                if dept.lower() in known_dept or known_dept in dept.lower():
                                    potential_departments.append(standard_name)
                                    break
                except:
                    continue
                        
        # Return the first found department or None
        if potential_departments:
            return potential_departments[0]
        
        return None
    
    except Exception as e:
        logger.error(f"Error extracting department: {e}")
        return None

def check_authorization(employee_id, employee_dept, requested_dept, employee_info=None):
    """Check if an employee is authorized to access data from a requested department.
    
    Args:
        employee_id (str): ID of the employee making the request
        employee_dept (str): Department of the employee making the request
        requested_dept (str): Department whose data is being requested
        employee_info (dict): Additional employee information including past_violations, join_date, ip_address
        
    Returns:
        bool: True if authorized, False otherwise
        str: Reason for authorization decision
    """
    try:
        # If no specific department was requested/detected
        if not requested_dept:
            logger.warning("No specific department detected in the query")
            return False, "No specific department detected in the query"
        
        # Enhanced security checks based on additional factors
        if employee_info:
            # 1. Check IP address - localhost (127.0.0.1) gets special treatment
            ip_address = employee_info.get('ip_address', '')
            is_localhost = ip_address == '127.0.0.1' or ip_address == 'localhost'
            
            # 2. Check past violations - reject if too many violations
            past_violations = employee_info.get('past_violations', 0)
            try:
                past_violations = int(past_violations)
            except (ValueError, TypeError):
                past_violations = 0
                
            # 3. Check join date - newer employees might have more restrictions
            join_date = employee_info.get('join_date', '')
            is_new_employee = False
            
            if join_date:
                try:
                    from datetime import datetime
                    # Assuming join_date is in format YYYY-MM-DD
                    join_date_obj = datetime.strptime(join_date, '%Y-%m-%d')
                    today = datetime.now()
                    months_employed = (today.year - join_date_obj.year) * 12 + (today.month - join_date_obj.month)
                    is_new_employee = months_employed < 3  # Less than 3 months at company
                except Exception as e:
                    logger.warning(f"Error processing join date: {e}")
            
            # Security decision logic based on additional factors
            
            # Automatic rejection for serious security concerns
            if past_violations >= 3:
                logger.warning(f"Employee {employee_id} has {past_violations} past violations - access denied")
                return False, f"Access denied due to {past_violations} past security violations"
            
            # Special case: New employees with past violations have restricted access
            if is_new_employee and past_violations > 0:
                # New employees with violations can only access their own department
                if employee_dept != requested_dept:
                    logger.warning(f"New employee {employee_id} with past violations - restricted to own department")
                    return False, "New employees with past violations can only access their own department"
            
            # Localhost gets elevated privileges (typically for admin/dev purposes)
            if is_localhost:
                logger.info(f"Request from localhost ({ip_address}) - granting elevated access")
                return True, "Localhost connection with elevated access"
        
        # Always allow employees to access their own department's data
        if employee_dept == requested_dept:
            logger.info(f"Employee {employee_id} authorized to access their own department ({employee_dept})")
            return True, "Access to own department data"
        
        # Special roles with broader access (could be loaded from a database)
        # This is a simplified example - in production, you would use a proper role-based system
        special_roles = {
            # Format: employee_id: [departments_with_access]
            "HR001": DEPARTMENTS,  # HR admin with access to all departments
            "EXEC001": DEPARTMENTS,  # Executive with access to all departments
            "IT001": DEPARTMENTS,   # IT admin with access to all departments
            # Add more special roles as needed
        }
        
        # Check for special roles
        if employee_id in special_roles and requested_dept in special_roles[employee_id]:
            # If employee has past violations, extra scrutiny even with special role
            if employee_info and past_violations > 0:
                logger.warning(f"Special role user {employee_id} has {past_violations} violations - restricted privileges")
                if past_violations >= 2:
                    return False, f"Special role restricted due to {past_violations} violations"
            
            logger.info(f"Employee {employee_id} has special role authorization for {requested_dept}")
            return True, f"Special role authorization for {requested_dept}"
        
        # Cross-department access rules (this would likely come from a database)
        # This is a simplified example
        cross_dept_access = {
            "Human Resources": DEPARTMENTS,  # HR can access all departments
            "Legal": DEPARTMENTS,  # Legal can access all departments
            "Accounting": ["Sales", "Marketing", "Business Development", "Services"],  # Finance can access revenue departments
            "Engineering": ["Product Management", "Research and Development"],  # Engineering can access related technical departments
            # Add more cross-department rules as needed
        }
        
        # Check cross-department access rules - with added restriction for employees with violations
        if employee_dept in cross_dept_access and requested_dept in cross_dept_access[employee_dept]:
            # If employee has past violations, extra scrutiny for cross-department access
            if employee_info and past_violations > 0:
                logger.warning(f"Employee {employee_id} has {past_violations} violations - restricted cross-dept access")
                return False, f"Cross-department access restricted due to past violations"
                
            logger.info(f"Employee from {employee_dept} has cross-department authorization for {requested_dept}")
            return True, f"Cross-department authorization from {employee_dept} to {requested_dept}"
        
        # Default: no access
        logger.warning(f"Employee {employee_id} from {employee_dept} NOT authorized to access {requested_dept}")
        return False, f"No authorization from {employee_dept} to {requested_dept}"
    
    except Exception as e:
        logger.error(f"Error in authorization check: {e}")
        # Default to denying access on error
        return False, f"Authorization error: {str(e)}"

def process_result(is_related, predicted_label, confidence, employee_info=None, query=None):
    """Process and display classification results with authorization check."""
    print(f"Prediction: {predicted_label} (confidence: {confidence:.2f})")
    
    if not is_related:
        print("❌ Non-corporate query - Do not respond")
        return False
    
    # If we have employee info, perform authorization check
    if employee_info and query:
        # Extract employee details
        employee_id = employee_info.get('id', 'unknown')
        employee_dept = employee_info.get('department', 'unknown')
        
        # Extract requested department from query
        requested_dept = extract_requested_department(query)
        
        if requested_dept:
            print(f"📊 Department requested: {requested_dept}")
            
            # Check authorization with full employee info
            is_authorized, reason = check_authorization(employee_id, employee_dept, requested_dept, employee_info)
            
            if is_authorized:
                print(f"✅ AUTHORIZED: {reason}")
                print(f"✅ Corporate/Business query with valid authorization - Generate response")
                return True
            else:
                print(f"❌ UNAUTHORIZED: {reason}")
                print(f"❌ Corporate/Business query but unauthorized - Block response")
                return False
        else:
            print("⚠️ No specific department detected in the query")
            print("✅ Corporate/Business query - Generate general response")
            return True
    else:
        # No authorization check needed/possible
        print("✅ Corporate/Business query - Generate response")
        return True

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

def test_authorization_examples(classifier):
    """Test the classifier with authorization examples."""
    # Sample employee data for testing
    test_employees = [
        {"id": "EMP001", "name": "John Doe", "department": "Human Resources", "ip_address": "192.168.1.101", "join_date": "2020-01-15", "past_violations": 0},
        {"id": "EMP002", "name": "Jane Smith", "department": "Engineering", "ip_address": "192.168.1.102", "join_date": "2019-05-20", "past_violations": 1},
        {"id": "EMP003", "name": "Bob Johnson", "department": "Sales", "ip_address": "192.168.1.103", "join_date": "2022-11-10", "past_violations": 0},
        {"id": "HR001", "name": "Admin User", "department": "Human Resources", "ip_address": "127.0.0.1", "join_date": "2018-03-01", "past_violations": 0},
        {"id": "EMP004", "name": "Alice Brown", "department": "Marketing", "ip_address": "192.168.1.104", "join_date": "2023-01-05", "past_violations": 2},
        {"id": "EMP005", "name": "Charlie Wilson", "department": "Engineering", "ip_address": "192.168.1.105", "join_date": "2022-12-01", "past_violations": 3},
    ]
    
    test_queries = [
        # Department-specific queries
        "What is the programming language used in the company?",
        "Show me the Engineering team's project status",
        "List all employees in the Sales department",
        "What's the budget for the Marketing department?",
        "How many people work in R&D?",
        
        # General queries
        "What's the company holiday policy?",
        "When is the next company meeting?",
        "How do I submit my timesheet?",
    ]
    
    print("\n===== TESTING ENHANCED AUTHORIZATION SYSTEM =====")
    
    for employee in test_employees:
        print(f"\n👤 EMPLOYEE: {employee['name']} (ID: {employee['id']}, Dept: {employee['department']})")
        print(f"   Join Date: {employee['join_date']}, IP: {employee['ip_address']}, Past Violations: {employee['past_violations']}")
        
        for query in test_queries:
            print(f"\nQuery: {query}")
            is_corporate, predicted_label, confidence, scores = is_corporate_related(query, classifier)
            
            # If corporate-related, do authorization check
            if is_corporate:
                # Get the department being requested
                requested_dept = extract_requested_department(query)
                if requested_dept:
                    print(f"Department requested: {requested_dept}")
                    
                    # Check authorization with enhanced factors
                    is_authorized, reason = check_authorization(
                        employee['id'], 
                        employee['department'], 
                        requested_dept,
                        employee
                    )
                    
                    auth_status = "✅ AUTHORIZED" if is_authorized else "❌ UNAUTHORIZED"
                    print(f"Authorization: {auth_status} - {reason}")
                else:
                    print("⚠️ No specific department detected in query")
            
            # Process the full result
            process_result(is_corporate, predicted_label, confidence, employee, query)
            print("-" * 50)
    
    print("\n===== END OF ENHANCED AUTHORIZATION TEST =====")

def main():
    try:
        # Load zero-shot classifier
        classifier = load_classifier()
        
        # Run test examples
        # test_examples(classifier)
        
        # Run authorization test examples
        test_authorization_examples(classifier)
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
