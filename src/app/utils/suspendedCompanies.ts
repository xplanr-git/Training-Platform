// Utility for managing suspended companies
// In a real app, this would be stored in a database

const SUSPENDED_COMPANIES_KEY = 'teachly_suspended_companies';

export interface SuspendedCompanyInfo {
  companyId: string;
  companyName: string;
  suspendedAt: string;
  suspendedBy: string;
}

export const suspendedCompaniesStore = {
  // Get all suspended companies
  getSuspendedCompanies(): SuspendedCompanyInfo[] {
    try {
      const stored = localStorage.getItem(SUSPENDED_COMPANIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading suspended companies:', error);
      return [];
    }
  },

  // Check if a company is suspended
  isCompanySuspended(companyName: string): boolean {
    const suspended = this.getSuspendedCompanies();
    return suspended.some(
      (s) => s.companyName.toLowerCase() === companyName.toLowerCase()
    );
  },

  // Suspend a company
  suspendCompany(companyId: string, companyName: string, adminEmail: string): void {
    const suspended = this.getSuspendedCompanies();
    
    // Check if already suspended
    if (!suspended.some((s) => s.companyId === companyId)) {
      suspended.push({
        companyId,
        companyName,
        suspendedAt: new Date().toISOString(),
        suspendedBy: adminEmail,
      });
      
      try {
        localStorage.setItem(SUSPENDED_COMPANIES_KEY, JSON.stringify(suspended));
      } catch (error) {
        console.error('Error suspending company:', error);
      }
    }
  },

  // Unsuspend a company
  unsuspendCompany(companyId: string): void {
    const suspended = this.getSuspendedCompanies();
    const filtered = suspended.filter((s) => s.companyId !== companyId);
    
    try {
      localStorage.setItem(SUSPENDED_COMPANIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error unsuspending company:', error);
    }
  },

  // Clear all suspensions (for testing)
  clearAll(): void {
    try {
      localStorage.removeItem(SUSPENDED_COMPANIES_KEY);
    } catch (error) {
      console.error('Error clearing suspended companies:', error);
    }
  },
};
