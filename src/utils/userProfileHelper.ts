// Helper to resolve the user display name configured by admin

export interface ResolvedUserProfile {
  name: string;
  email: string;
  role: string;
  balance?: number;
  status?: string;
}

export function getUserDisplayName(userEmail?: string | null): string {
  if (!userEmail) {
    userEmail = localStorage.getItem('codeflow_user') || 'xzrmunna7788@gmail.com';
  }
  const emailLower = userEmail.toLowerCase().trim();

  // 1. Check Admin Users List (set from Admin Panel)
  try {
    const adminUsersRaw = localStorage.getItem('codeflow_admin_users_list_v2');
    if (adminUsersRaw) {
      const adminUsers = JSON.parse(adminUsersRaw);
      if (Array.isArray(adminUsers)) {
        const match = adminUsers.find(
          (u: any) =>
            u.email?.toLowerCase().trim() === emailLower ||
            u.id?.toLowerCase() === emailLower
        );
        if (match && match.name && match.name.trim().length > 0) {
          return match.name.trim();
        }
      }
    }
  } catch (e) {
    // Ignore JSON error
  }

  // 2. Check Registered Users List (created upon admin approval or registration)
  try {
    const regUsersRaw = localStorage.getItem('codeflow_registered_users');
    if (regUsersRaw) {
      const regUsers = JSON.parse(regUsersRaw);
      if (Array.isArray(regUsers)) {
        const match = regUsers.find(
          (u: any) =>
            u.email?.toLowerCase().trim() === emailLower ||
            u.name?.toLowerCase().trim() === emailLower
        );
        if (match && match.name && match.name.trim().length > 0) {
          return match.name.trim();
        }
      }
    }
  } catch (e) {
    // Ignore JSON error
  }

  // 3. Check explicit custom username
  const explicitUsername = localStorage.getItem('codeflow_username');
  if (explicitUsername && explicitUsername.trim().length > 0) {
    return explicitUsername.trim();
  }

  // 4. Fallback: If it's the admin default account
  if (emailLower === 'xzrmunna7788@gmail.com' || emailLower === 'xzrmunna7788') {
    return 'XZRMUNNA7788';
  }

  // 5. Fallback to email username portion in uppercase
  const fallback = emailLower.includes('@') ? emailLower.split('@')[0] : emailLower;
  return fallback.toUpperCase();
}

export function getUserProfileDetails(userEmail?: string | null): ResolvedUserProfile {
  const currentEmail = (userEmail || localStorage.getItem('codeflow_user') || 'xzrmunna7788@gmail.com').trim();
  const emailLower = currentEmail.toLowerCase();
  const name = getUserDisplayName(currentEmail);

  let role = 'User';
  let balance = 0;
  let status = 'Active';

  if (
    emailLower === 'xzrmunna7788@gmail.com' ||
    emailLower === 'xzrmunna974@gmail.com' ||
    emailLower === 'xzrmunna7788'
  ) {
    role = 'Admin';
  }

  try {
    const adminUsersRaw = localStorage.getItem('codeflow_admin_users_list_v2');
    if (adminUsersRaw) {
      const adminUsers = JSON.parse(adminUsersRaw);
      if (Array.isArray(adminUsers)) {
        const match = adminUsers.find(
          (u: any) => u.email?.toLowerCase().trim() === emailLower
        );
        if (match) {
          role = match.role || role;
          balance = typeof match.balance === 'number' ? match.balance : balance;
          status = match.status || status;
        }
      }
    }
  } catch (e) {}

  return {
    name,
    email: currentEmail,
    role,
    balance,
    status,
  };
}
