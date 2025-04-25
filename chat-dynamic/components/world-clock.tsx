"use client"
import { useEffect, useState } from 'react';

interface TimeZone {
  country: string;
  city: string;
  timezone: string;
}

const timeZones: TimeZone[] = [
  { country: 'India', city: 'Mumbai', timezone: 'Asia/Kolkata' },
  { country: 'United States', city: 'New York', timezone: 'America/New_York' },
  { country: 'United Kingdom', city: 'London', timezone: 'Europe/London' },
  { country: 'Japan', city: 'Tokyo', timezone: 'Asia/Tokyo' },
  { country: 'Australia', city: 'Sydney', timezone: 'Australia/Sydney' },
];

export const WorldClock = () => {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: Record<string, string> = {};
      timeZones.forEach(({ timezone }) => {
        newTimes[timezone] = new Date().toLocaleTimeString('en-US', {
          timeZone: timezone,
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
        });
      });
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {timeZones.map(({ country, city, timezone }) => (
        <div
          key={timezone}
          className="bg-[#111111] rounded-xl shadow-lg p-6 flex flex-col items-center border border-[#222222] hover:border-[#00E5BE] transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2 text-[#00E5BE]">{city}</h3>
          <p className="text-sm text-[#888888] mb-3">{country}</p>
          <div className="text-3xl font-mono text-white tracking-wider">{times[timezone] || '--:--'}</div>
        </div>
      ))}
    </div>
  );
}; 