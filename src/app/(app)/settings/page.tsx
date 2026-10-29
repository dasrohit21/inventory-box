"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { getSettings, saveSettings, getUser, saveUser, isValidEmail, logout, getTeam, inviteTeamMember, updateTeamMember, deleteTeamMember, type AppSettings, type User, type TeamMember, type TeamRole, type TeamStatus } from "@/lib/data";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "account" | "team" | "danger">("general");

  // Team state
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("Viewer");
  const [inviteDept, setInviteDept] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  // Profile form state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileDept, setProfileDept] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    setSettings(getSettings());
    const u = getUser();
    const sanitizedEmail = isValidEmail(u.email) ? u.email : "";
    if (!sanitizedEmail && u.email) {
      // Drop the invalid email from storage so it doesn't keep getting recalled.
      saveUser({ email: "" });
      setProfileError(`The previously stored email "${u.email}" is not a valid address. Please enter a new one.`);
    }
    setUser({ ...u, email: sanitizedEmail });
    setProfileName(u.name);
    setProfileEmail(sanitizedEmail);
    setProfileDept(u.department || "Instrumentation & Control");
    setTeam(getTeam());
  }, []);

  const handleInvite = () => {
    setInviteError("");
    if (!inviteName.trim()) { setInviteError("Name is required."); return; }
    if (!isValidEmail(inviteEmail)) { setInviteError("Please enter a valid email address."); return; }
    if (team.some((t) => t.email.toLowerCase() === inviteEmail.toLowerCase().trim())) {
      setInviteError("A team member with that email already exists.");
      return;
    }
    inviteTeamMember({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole, department: inviteDept.trim() || undefined });
    setTeam(getTeam());
    setInviteName(""); setInviteEmail(""); setInviteRole("Viewer"); setInviteDept("");
    setShowInvite(false);
  };

  const handleRoleChange = (id: number, role: TeamRole) => {
    updateTeamMember(id, { role });
    setTeam(getTeam());
  };

  const handleStatusChange = (id: number, status: TeamStatus) => {
    updateTeamMember(id, { status });
    setTeam(getTeam());
  };

  const handleDeleteMember = () => {
    if (!deleteTarget) return;
    deleteTeamMember(deleteTarget.id);
    setTeam(getTeam());
    setDeleteTarget(null);
  };

  const teamStats = {
    total: team.length,
    active: team.filter((t) => t.status === "Active").length,
    pending: team.filter((t) => t.status === "Pending").length,
  };

  const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
    "Admin": "Full access to all features, settings, and team management.",
    "Manager": "Manage products, orders, customers, suppliers, and reports.",
    "Warehouse Staff": "Update stock, fulfill orders, receive purchase orders.",
    "Viewer": "Read-only access to dashboards and reports.",
  };

  const handleSave = () => {
    if (!settings) return;
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveProfile = () => {
    setProfileError("");
    if (!profileName.trim()) {
      setProfileError("Name is required.");
      return;
    }
    if (!isValidEmail(profileEmail)) {
      setProfileError("Please enter a valid email address (e.g. you@company.com).");
      return;
    }
    const updated = saveUser({ name: profileName.trim(), email: profileEmail.trim(), department: profileDept.trim() });
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const emailIsBad = profileEmail.length > 0 && !isValidEmail(profileEmail);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleReset = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      router.push("/");
    }
  };

  if (!settings || !user) return null;

  const tabs = [
    { id: "general" as const, label: "General", icon: "tune" },
    { id: "notifications" as const, label: "Notifications", icon: "notifications" },
    { id: "account" as const, label: "Account", icon: "person" },
    { id: "team" as const, label: "Team & Roles", icon: "groups" },
    { id: "danger" as const, label: "Danger Zone", icon: "warning" },
  ];

  const roleBadge = (role: TeamRole) => {
    if (role === "Admin") return "bg-primary/10 text-primary";
    if (role === "Manager") return "bg-indigo-500/10 text-indigo-400";
    if (role === "Warehouse Staff") return "bg-tertiary/10 text-tertiary";
    return "bg-surface-container-highest text-on-surface-variant";
  };

  const statusBadge = (status: TeamStatus) => {
    if (status === "Active") return "bg-emerald-500/10 text-emerald-400";
    if (status === "Pending") return "bg-tertiary/10 text-tertiary";
    return "bg-error/10 text-error";
  };

  return (
    <>
      <TopBar subtitle="Settings" />
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <section className="mb-10">
          <h2 className="text-4xl font-black tracking-tight text-on-surface mb-2">Settings</h2>
          <p className="text-on-surface-variant font-medium">Configure your inventory management system preferences.</p>
        </section>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-surface-container rounded-xl p-1 border border-outline-variant/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Success Toast */}
        {saved && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2" style={{ animation: "fade-in 0.2s ease-out" }}>
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Settings saved successfully!
          </div>
        )}

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5 shadow-xl">
              <h3 className="font-bold text-on-surface mb-1">Company Information</h3>
              <p className="text-xs text-on-surface-variant mb-6">Basic organization settings</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Company Name</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Currency</label>
                    <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (&euro;) - Euro</option>
                      <option value="GBP">GBP (&pound;) - British Pound</option>
                      <option value="JPY">JPY (&yen;) - Japanese Yen</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Language</label>
                    <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Japanese</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Timezone</label>
                  <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}>
                    <option>UTC+5:30 (IST - India)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (CET)</option>
                    <option>UTC-5 (EST - US Eastern)</option>
                    <option>UTC-6 (CST - US Central)</option>
                    <option>UTC-8 (PST - US Pacific)</option>
                    <option>UTC+8 (SGT - Singapore)</option>
                    <option>UTC+9 (JST - Japan)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5 shadow-xl">
              <h3 className="font-bold text-on-surface mb-1">Inventory Settings</h3>
              <p className="text-xs text-on-surface-variant mb-6">Configure stock management rules</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Low Stock Threshold</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="5" max="100" className="flex-1 accent-primary" value={settings.lowStockThreshold} onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) })} />
                    <div className="bg-surface-container-highest rounded-lg px-4 py-2 min-w-[60px] text-center">
                      <span className="text-sm font-bold text-primary">{settings.lowStockThreshold}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">Products with stock below this number will be marked as &quot;Low Stock&quot;</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">save</span>
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5 shadow-xl">
            <h3 className="font-bold text-on-surface mb-1">Notification Preferences</h3>
            <p className="text-xs text-on-surface-variant mb-6">Manage how you receive updates and alerts</p>
            <div className="space-y-1">
              {[
                { label: "Email Notifications", desc: "Receive order and stock alerts via email", key: "emailNotifications", enabled: settings.emailNotifications },
                { label: "Low Stock Alerts", desc: "Get notified when products fall below threshold", key: "lowStockAlerts", enabled: true },
                { label: "Order Updates", desc: "Notifications for new and updated orders", key: "orderUpdates", enabled: true },
                { label: "Supplier Notifications", desc: "Alerts about supplier status changes", key: "supplierNotifs", enabled: false },
                { label: "Weekly Report", desc: "Receive a weekly inventory summary email", key: "weeklyReport", enabled: true },
                { label: "System Maintenance", desc: "Get notified about system updates and downtime", key: "systemMaint", enabled: true },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-4 border-b border-outline-variant/10 last:border-none">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{item.label}</p>
                    <p className="text-[11px] text-on-surface-variant">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (item.key === "emailNotifications") {
                        setSettings({ ...settings, emailNotifications: !settings.emailNotifications });
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${item.enabled ? "bg-primary" : "bg-surface-container-highest"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${item.enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={handleSave} className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">save</span>
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5 shadow-xl">
              <h3 className="font-bold text-on-surface mb-6">Profile Information</h3>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-primary-container/30 flex items-center justify-center text-2xl font-black text-primary border border-primary/20">
                  {(user.name || "JT").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-on-surface">{user.name}</h4>
                  <p className="text-sm text-on-surface-variant">{user.role}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{user.email}</p>
                </div>
              </div>

              {profileError && (
                <div className="bg-error-container/20 border border-error/20 text-error text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {profileError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Full Name</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block flex items-center gap-2">
                    Email
                    {emailIsBad && <span className="text-[10px] text-error normal-case font-medium">Invalid format</span>}
                  </label>
                  <input
                    type="email"
                    className={`w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 ${emailIsBad ? "ring-2 ring-error/60 focus:ring-error/60" : "focus:ring-primary/50"}`}
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Role</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface/50 rounded-lg px-4 py-3 cursor-not-allowed" defaultValue={user.role} readOnly />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Department</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={profileDept} onChange={(e) => setProfileDept(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSaveProfile} disabled={emailIsBad || !profileEmail} className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  <span className="material-symbols-outlined text-lg">save</span>
                  Update Profile
                </button>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5 shadow-xl">
              <h3 className="font-bold text-on-surface mb-6">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Current Password</label>
                  <input type="password" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">New Password</label>
                  <input type="password" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Confirm New Password</label>
                  <input type="password" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button className="bg-surface-container-highest text-on-surface font-bold px-8 py-3 rounded-xl hover:bg-surface-bright transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">lock</span>
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team & Roles Tab */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5 shadow-xl">
              <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h3 className="font-bold text-on-surface">Team Members</h3>
                  <p className="text-xs text-on-surface-variant">Manage who has access to this workspace and what they can do.</p>
                </div>
                <button onClick={() => { setInviteError(""); setShowInvite(true); }} className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Invite Member
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-surface-container-highest rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Total</p>
                  <p className="text-xl font-black text-on-surface mt-1">{teamStats.total}</p>
                </div>
                <div className="bg-surface-container-highest rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Active</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{teamStats.active}</p>
                </div>
                <div className="bg-surface-container-highest rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Pending</p>
                  <p className="text-xl font-black text-tertiary mt-1">{teamStats.pending}</p>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-container-high/40 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Member</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Last Active</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {team.map((m) => (
                      <tr key={m.id} className="hover:bg-surface-container-high/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-container/30 flex items-center justify-center text-xs font-bold text-primary">
                              {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-on-surface">{m.name}</p>
                              <p className="text-[11px] text-on-surface-variant">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            disabled={m.id === 1}
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value as TeamRole)}
                            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full focus:ring-2 focus:ring-primary/50 border-none ${roleBadge(m.role)} ${m.id === 1 ? "opacity-80 cursor-not-allowed" : "cursor-pointer"}`}
                            title={ROLE_DESCRIPTIONS[m.role]}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Warehouse Staff">Warehouse Staff</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            disabled={m.id === 1}
                            value={m.status}
                            onChange={(e) => handleStatusChange(m.id, e.target.value as TeamStatus)}
                            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full focus:ring-2 focus:ring-primary/50 border-none ${statusBadge(m.status)} ${m.id === 1 ? "opacity-80 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Disabled">Disabled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant hidden md:table-cell">{m.lastActive || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          {m.id !== 1 ? (
                            <button onClick={() => setDeleteTarget(m)} title="Remove member" className="w-8 h-8 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error transition-all inline-flex items-center justify-center">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant/60">You</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {team.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant text-sm">No team members yet — invite your first one.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role reference */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5 shadow-xl">
              <h3 className="font-bold text-on-surface mb-1">Role Permissions</h3>
              <p className="text-xs text-on-surface-variant mb-5">What each role can do in this workspace.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(["Admin", "Manager", "Warehouse Staff", "Viewer"] as TeamRole[]).map((r) => (
                  <div key={r} className="bg-surface-container-low rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge(r)}`}>{r}</span>
                      <span className="text-[10px] text-on-surface-variant">{team.filter((t) => t.role === r).length} member{team.filter((t) => t.role === r).length === 1 ? "" : "s"}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{ROLE_DESCRIPTIONS[r]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === "danger" && (
          <div className="space-y-6">
            <div className="bg-surface-container rounded-xl p-6 border border-error/10 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-error text-2xl">warning</span>
                <div>
                  <h3 className="font-bold text-on-surface">Danger Zone</h3>
                  <p className="text-xs text-on-surface-variant">These actions are irreversible. Please proceed with caution.</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between py-4 border-b border-outline-variant/10">
                  <div>
                    <p className="text-sm font-medium text-on-surface">Log Out</p>
                    <p className="text-[11px] text-on-surface-variant">Sign out of your current session</p>
                  </div>
                  <button onClick={handleLogout} className="px-5 py-2.5 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">logout</span> Log Out
                  </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-outline-variant/10">
                  <div>
                    <p className="text-sm font-medium text-on-surface">Export All Data</p>
                    <p className="text-[11px] text-on-surface-variant">Download all your inventory data as JSON</p>
                  </div>
                  <button
                    onClick={() => {
                      const data = JSON.stringify(localStorage, null, 2);
                      const blob = new Blob([data], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "inventory-backup.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-5 py-2.5 rounded-lg bg-surface-container-highest text-primary font-medium hover:bg-surface-bright transition-colors text-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">download</span> Export
                  </button>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium text-error">Reset All Data</p>
                    <p className="text-[11px] text-on-surface-variant">Clear all stored data and return to default state</p>
                  </div>
                  <button onClick={handleReset} className="px-5 py-2.5 rounded-lg bg-error-container text-on-error-container font-bold hover:brightness-110 transition-all text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">delete_forever</span> Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5 shadow-xl">
              <h3 className="font-bold text-on-surface mb-4">System Information</h3>
              <div className="space-y-2">
                {[
                  { label: "Version", value: "v2.4.0-Final" },
                  { label: "Framework", value: "Next.js 16" },
                  { label: "Storage", value: "LocalStorage" },
                  { label: "Node", value: "Alpha-12" },
                  { label: "Last Updated", value: new Date().toLocaleDateString() },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-none">
                    <span className="text-sm text-on-surface-variant">{item.label}</span>
                    <span className="text-sm font-mono font-bold text-on-surface">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-lg p-8" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person_add</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">Invite Team Member</h3>
                <p className="text-xs text-on-surface-variant">They&apos;ll appear as &quot;Pending&quot; until they accept the invitation.</p>
              </div>
            </div>

            {inviteError && (
              <div className="bg-error-container/20 border border-error/20 text-error text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {inviteError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Full Name</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="e.g. Alice Singh" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Email</label>
                  <input type="email" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="alice@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Role</label>
                <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as TeamRole)}>
                  <option value="Admin">Admin — full access</option>
                  <option value="Manager">Manager — manage data + reports</option>
                  <option value="Warehouse Staff">Warehouse Staff — stock + fulfillment</option>
                  <option value="Viewer">Viewer — read-only</option>
                </select>
                <p className="text-[11px] text-on-surface-variant mt-1.5">{ROLE_DESCRIPTIONS[inviteRole]}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Department <span className="normal-case font-medium text-on-surface-variant/60">(optional)</span></label>
                <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="e.g. Logistics" value={inviteDept} onChange={(e) => setInviteDept(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowInvite(false)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleInvite} className="px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-base">send</span>
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-sm p-8 text-center" style={{ animation: "fade-in 0.2s ease-out" }}>
            <span className="material-symbols-outlined text-error text-5xl mb-4">person_remove</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Remove Team Member?</h3>
            <p className="text-sm text-on-surface-variant mb-6">Revoke access for <strong className="text-on-surface">{deleteTarget.name}</strong>? They&apos;ll be removed from the workspace.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleDeleteMember} className="px-6 py-3 rounded-lg bg-error-container text-on-error-container font-bold hover:brightness-110 active:scale-95 transition-all">Remove</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
