export interface UserWorkspace {
  email: string;
  rented_numbers: any[];
  test_numbers: any[];
  sms_logs: any[];
  notifications: any[];
  profile?: any;
  lastUpdated?: string;
}

// Fetch user workspace state from server
export async function fetchUserWorkspace(email: string): Promise<UserWorkspace | null> {
  if (!email) return null;
  try {
    const res = await fetch(`/api/user-workspace/${encodeURIComponent(email.toLowerCase().trim())}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.workspace) {
        return json.workspace;
      }
    }
  } catch (err) {
    console.warn('[Workspace] Error fetching user workspace:', err);
  }
  return null;
}

// Save user workspace state to server
export async function saveUserWorkspace(email: string, workspace: Partial<UserWorkspace>): Promise<boolean> {
  if (!email) return false;
  try {
    const res = await fetch(`/api/user-workspace/${encodeURIComponent(email.toLowerCase().trim())}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        ...workspace,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.success;
    }
  } catch (err) {
    console.warn('[Workspace] Error saving user workspace:', err);
  }
  return false;
}

// Load server workspace into local state & storage for immediate sync
export async function syncUserWorkspaceFromServer(email: string) {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();
  const workspace = await fetchUserWorkspace(cleanEmail);
  if (workspace) {
    if (Array.isArray(workspace.rented_numbers)) {
      localStorage.setItem(`rented_numbers_${cleanEmail}`, JSON.stringify(workspace.rented_numbers));
      localStorage.setItem('rented_numbers', JSON.stringify(workspace.rented_numbers));
      window.dispatchEvent(new Event('rented_numbers_updated'));
    }
    if (Array.isArray(workspace.test_numbers)) {
      localStorage.setItem(`test_numbers_${cleanEmail}`, JSON.stringify(workspace.test_numbers));
      localStorage.setItem('test_numbers', JSON.stringify(workspace.test_numbers));
      window.dispatchEvent(new Event('test_numbers_updated'));
    }
    if (Array.isArray(workspace.sms_logs)) {
      localStorage.setItem(`real_sms_logs_${cleanEmail}`, JSON.stringify(workspace.sms_logs));
      localStorage.setItem('real_sms_logs', JSON.stringify(workspace.sms_logs));
      window.dispatchEvent(new Event('real_sms_updated'));
    }
    if (Array.isArray(workspace.notifications)) {
      localStorage.setItem('codeflow_user_notifications', JSON.stringify(workspace.notifications));
      window.dispatchEvent(new Event('codeflow_notifications_updated'));
    }
    if (workspace.profile) {
      localStorage.setItem(`codeflow_user_profile_${cleanEmail}`, JSON.stringify(workspace.profile));
      window.dispatchEvent(new Event('codeflow_profile_updated'));
    }
  }
}

// Push local state changes for a user to server
export async function pushUserWorkspaceToServer(email: string) {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();
  
  let rented_numbers: any[] = [];
  let test_numbers: any[] = [];
  let sms_logs: any[] = [];
  let notifications: any[] = [];
  let profile: any = null;

  try {
    const r = localStorage.getItem('rented_numbers');
    if (r) rented_numbers = JSON.parse(r);
  } catch(e) {}

  try {
    const t = localStorage.getItem('test_numbers');
    if (t) test_numbers = JSON.parse(t);
  } catch(e) {}

  try {
    const s = localStorage.getItem('real_sms_logs');
    if (s) sms_logs = JSON.parse(s);
  } catch(e) {}

  try {
    const n = localStorage.getItem('codeflow_user_notifications');
    if (n) notifications = JSON.parse(n);
  } catch(e) {}

  try {
    const p = localStorage.getItem(`codeflow_user_profile_${cleanEmail}`);
    if (p) profile = JSON.parse(p);
  } catch(e) {}

  await saveUserWorkspace(cleanEmail, {
    rented_numbers,
    test_numbers,
    sms_logs,
    notifications,
    profile,
  });
}
