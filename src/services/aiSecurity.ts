// AI Security and Rate Limiting Service
export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  cooldownPeriod: number; // in milliseconds
  bulkGenerationCooldown: number; // shorter cooldown for bulk operations
}

export interface UsageStats {
  requestsToday: number;
  requestsThisHour: number;
  requestsThisMinute: number;
  lastRequestTime: number;
  totalRequests: number;
  consecutiveRequests: number;
  lastResetTime: number;
  isBulkGeneration: boolean; // flag to indicate bulk generation mode
  bulkGenerationStartTime: number;
}

export interface SecurityViolation {
  type: 'rate_limit' | 'suspicious_pattern' | 'abuse_detected';
  timestamp: number;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

class AISecurityManager {
  private readonly STORAGE_KEY = 'ai-security-data';
  private readonly VIOLATIONS_KEY = 'ai-security-violations';
  
  // Rate limiting configuration
  private readonly rateLimits: RateLimitConfig = {
    maxRequestsPerMinute: 15,    // Increased for bulk generation
    maxRequestsPerHour: 50,     // Increased hourly limit
    maxRequestsPerDay: 200,     // Increased daily limit
    cooldownPeriod: 20000,      // 20 second cooldown between single requests
    bulkGenerationCooldown: 1000 // 1 second cooldown for bulk generation
  };

  // Get current usage stats
  private getUsageStats(): UsageStats {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const now = Date.now();
    
    if (!stored) {
      return this.createNewUsageStats(now);
    }

    try {
      const stats: UsageStats = JSON.parse(stored);
      
      // Reset bulk generation flag if it's been more than 5 minutes
      if (stats.isBulkGeneration && (now - stats.bulkGenerationStartTime) > 300000) {
        stats.isBulkGeneration = false;
        stats.bulkGenerationStartTime = 0;
      }
      
      // Reset counters if time periods have passed
      const hoursSinceReset = (now - stats.lastResetTime) / (1000 * 60 * 60);
      const daysSinceReset = hoursSinceReset / 24;
      
      if (daysSinceReset >= 1) {
        // Reset daily counters
        stats.requestsToday = 0;
        stats.requestsThisHour = 0;
        stats.requestsThisMinute = 0;
        stats.lastResetTime = now;
      } else if (hoursSinceReset >= 1) {
        // Reset hourly counters
        stats.requestsThisHour = 0;
        stats.requestsThisMinute = 0;
      } else if ((now - stats.lastResetTime) >= 60000) {
        // Reset minute counter (every minute)
        stats.requestsThisMinute = 0;
      }
      
      return stats;
    } catch (error) {
      console.error('Error parsing usage stats:', error);
      return this.createNewUsageStats(now);
    }
  }

  private createNewUsageStats(timestamp: number): UsageStats {
    return {
      requestsToday: 0,
      requestsThisHour: 0,
      requestsThisMinute: 0,
      lastRequestTime: 0,
      totalRequests: 0,
      consecutiveRequests: 0,
      lastResetTime: timestamp,
      isBulkGeneration: false,
      bulkGenerationStartTime: 0
    };
  }

  private saveUsageStats(stats: UsageStats): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving usage stats:', error);
    }
  }

  private logViolation(violation: SecurityViolation): void {
    try {
      const stored = localStorage.getItem(this.VIOLATIONS_KEY);
      const violations: SecurityViolation[] = stored ? JSON.parse(stored) : [];
      
      violations.push(violation);
      
      // Keep only last 100 violations to prevent storage bloat
      if (violations.length > 100) {
        violations.splice(0, violations.length - 100);
      }
      
      localStorage.setItem(this.VIOLATIONS_KEY, JSON.stringify(violations));
      
      // Log to console for monitoring
      console.warn('AI Security Violation:', violation);
    } catch (error) {
      console.error('Error logging security violation:', error);
    }
  }

  // Start bulk generation mode
  public startBulkGeneration(): void {
    const stats = this.getUsageStats();
    stats.isBulkGeneration = true;
    stats.bulkGenerationStartTime = Date.now();
    this.saveUsageStats(stats);
  }

  // End bulk generation mode
  public endBulkGeneration(): void {
    const stats = this.getUsageStats();
    stats.isBulkGeneration = false;
    stats.bulkGenerationStartTime = 0;
    this.saveUsageStats(stats);
  }

  // Check if request is allowed based on rate limits
  public checkRateLimit(isBulkRequest: boolean = false): { allowed: boolean; reason?: string; waitTime?: number } {
    const stats = this.getUsageStats();
    const now = Date.now();

    // Determine which cooldown period to use
    const cooldownPeriod = (stats.isBulkGeneration || isBulkRequest) 
      ? this.rateLimits.bulkGenerationCooldown 
      : this.rateLimits.cooldownPeriod;

    // Check cooldown period
    const timeSinceLastRequest = now - stats.lastRequestTime;
    if (timeSinceLastRequest < cooldownPeriod) {
      const waitTime = cooldownPeriod - timeSinceLastRequest;
      
      // Only log violation for non-bulk requests or if it's excessive
      if (!stats.isBulkGeneration && !isBulkRequest) {
        this.logViolation({
          type: 'rate_limit',
          timestamp: now,
          details: `Request blocked due to cooldown period. Wait ${Math.ceil(waitTime / 1000)} seconds.`,
          severity: 'low'
        });
      }
      
      return {
        allowed: false,
        reason: `Please wait ${Math.ceil(waitTime / 1000)} seconds between requests`,
        waitTime
      };
    }

    // More lenient limits during bulk generation
    const minuteLimit = stats.isBulkGeneration ? this.rateLimits.maxRequestsPerMinute : Math.min(this.rateLimits.maxRequestsPerMinute, 5);
    const hourlyLimit = this.rateLimits.maxRequestsPerHour;
    const dailyLimit = this.rateLimits.maxRequestsPerDay;

    // Check minute limit
    if (stats.requestsThisMinute >= minuteLimit) {
      this.logViolation({
        type: 'rate_limit',
        timestamp: now,
        details: `Minute limit exceeded: ${stats.requestsThisMinute}/${minuteLimit}`,
        severity: 'medium'
      });
      
      return {
        allowed: false,
        reason: `Rate limit exceeded. Maximum ${minuteLimit} requests per minute.`,
        waitTime: 60000 // Wait 1 minute
      };
    }

    // Check hourly limit
    if (stats.requestsThisHour >= hourlyLimit) {
      this.logViolation({
        type: 'rate_limit',
        timestamp: now,
        details: `Hourly limit exceeded: ${stats.requestsThisHour}/${hourlyLimit}`,
        severity: 'medium'
      });
      
      return {
        allowed: false,
        reason: `Hourly limit exceeded. Maximum ${hourlyLimit} requests per hour.`,
        waitTime: 3600000 // Wait 1 hour
      };
    }

    // Check daily limit
    if (stats.requestsToday >= dailyLimit) {
      this.logViolation({
        type: 'rate_limit',
        timestamp: now,
        details: `Daily limit exceeded: ${stats.requestsToday}/${dailyLimit}`,
        severity: 'high'
      });
      
      return {
        allowed: false,
        reason: `Daily limit exceeded. Maximum ${dailyLimit} requests per day.`,
        waitTime: 86400000 // Wait 24 hours
      };
    }

    // Check for suspicious patterns (but be more lenient during bulk generation)
    if (!stats.isBulkGeneration && !isBulkRequest) {
      const suspiciousPattern = this.detectSuspiciousPattern(stats, now);
      if (suspiciousPattern) {
        return {
          allowed: false,
          reason: suspiciousPattern.reason,
          waitTime: suspiciousPattern.waitTime
        };
      }
    }

    return { allowed: true };
  }

  // Detect suspicious usage patterns
  private detectSuspiciousPattern(stats: UsageStats, now: number): { reason: string; waitTime: number } | null {
    // Check for rapid consecutive requests (only for non-bulk operations)
    if (stats.consecutiveRequests >= 10) {
      const timeSinceLastRequest = now - stats.lastRequestTime;
      if (timeSinceLastRequest < 2000) { // Less than 2 seconds between requests
        this.logViolation({
          type: 'suspicious_pattern',
          timestamp: now,
          details: `Rapid consecutive requests detected: ${stats.consecutiveRequests} requests`,
          severity: 'high'
        });
        
        return {
          reason: 'Suspicious activity detected. Please slow down your requests.',
          waitTime: 60000 // 1 minute cooldown
        };
      }
    }

    // Check for unusual burst activity (more lenient)
    if (stats.requestsThisMinute >= 8 && stats.requestsThisHour >= 30) {
      this.logViolation({
        type: 'suspicious_pattern',
        timestamp: now,
        details: `Burst activity detected: ${stats.requestsThisMinute}/min, ${stats.requestsThisHour}/hour`,
        severity: 'medium'
      });
      
      return {
        reason: 'High usage detected. Please moderate your request frequency.',
        waitTime: 120000 // 2 minute cooldown
      };
    }

    return null;
  }

  // Record a successful request
  public recordRequest(isBulkRequest: boolean = false): void {
    const stats = this.getUsageStats();
    const now = Date.now();
    
    // Update counters
    stats.requestsToday++;
    stats.requestsThisHour++;
    stats.requestsThisMinute++;
    stats.totalRequests++;
    
    // Track consecutive requests (but be more lenient during bulk generation)
    const timeSinceLastRequest = now - stats.lastRequestTime;
    const consecutiveThreshold = stats.isBulkGeneration ? 5000 : 30000; // 5 seconds for bulk, 30 seconds for single
    
    if (timeSinceLastRequest < consecutiveThreshold) {
      stats.consecutiveRequests++;
    } else {
      stats.consecutiveRequests = 1;
    }
    
    stats.lastRequestTime = now;
    
    this.saveUsageStats(stats);
  }

  // Get current usage information for display
  public getUsageInfo(): {
    daily: { used: number; limit: number; percentage: number };
    hourly: { used: number; limit: number; percentage: number };
    minute: { used: number; limit: number; percentage: number };
    nextRequestAllowed: number;
    isBulkGeneration: boolean;
  } {
    const stats = this.getUsageStats();
    const now = Date.now();
    const cooldownPeriod = stats.isBulkGeneration 
      ? this.rateLimits.bulkGenerationCooldown 
      : this.rateLimits.cooldownPeriod;
    const nextRequestAllowed = Math.max(0, cooldownPeriod - (now - stats.lastRequestTime));
    
    const minuteLimit = stats.isBulkGeneration ? this.rateLimits.maxRequestsPerMinute : Math.min(this.rateLimits.maxRequestsPerMinute, 5);
    
    return {
      daily: {
        used: stats.requestsToday,
        limit: this.rateLimits.maxRequestsPerDay,
        percentage: (stats.requestsToday / this.rateLimits.maxRequestsPerDay) * 100
      },
      hourly: {
        used: stats.requestsThisHour,
        limit: this.rateLimits.maxRequestsPerHour,
        percentage: (stats.requestsThisHour / this.rateLimits.maxRequestsPerHour) * 100
      },
      minute: {
        used: stats.requestsThisMinute,
        limit: minuteLimit,
        percentage: (stats.requestsThisMinute / minuteLimit) * 100
      },
      nextRequestAllowed,
      isBulkGeneration: stats.isBulkGeneration
    };
  }

  // Reset usage stats (admin function)
  public resetUsageStats(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.VIOLATIONS_KEY);
  }

  // Get security violations for monitoring
  public getViolations(): SecurityViolation[] {
    try {
      const stored = localStorage.getItem(this.VIOLATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting violations:', error);
      return [];
    }
  }

  // Check if user is currently in a penalty period
  public isInPenaltyPeriod(): { inPenalty: boolean; reason?: string; remainingTime?: number } {
    const violations = this.getViolations();
    const now = Date.now();
    const recentViolations = violations.filter(v => now - v.timestamp < 3600000); // Last hour
    
    // If user has multiple high-severity violations in the last hour
    const highSeverityViolations = recentViolations.filter(v => v.severity === 'high');
    if (highSeverityViolations.length >= 5) { // Increased threshold
      const lastViolation = highSeverityViolations[highSeverityViolations.length - 1];
      const penaltyEnd = lastViolation.timestamp + 3600000; // 1 hour penalty
      
      if (now < penaltyEnd) {
        return {
          inPenalty: true,
          reason: 'Multiple security violations detected. Account temporarily restricted.',
          remainingTime: penaltyEnd - now
        };
      }
    }
    
    return { inPenalty: false };
  }
}

// Export singleton instance
export const aiSecurity = new AISecurityManager();

// Utility function to format time remaining
export const formatTimeRemaining = (milliseconds: number): string => {
  const seconds = Math.ceil(milliseconds / 1000);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
};