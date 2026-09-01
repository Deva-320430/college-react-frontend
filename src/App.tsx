import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, BookOpen, Eye, EyeOff, GraduationCap, Landmark, ShieldCheck, UserCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type User = {
  id: string;
  collegeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

type UserListItem = {
  id: string;
  collegeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

const roleTitles: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin Dashboard',
  ADMIN: 'Admin Dashboard',
  CHAIRMAN: 'Chairman Dashboard',
  EXAM_CELL: 'Exam Cell Dashboard',
  TEACHER: 'Teacher Dashboard',
  STUDENT: 'Student Dashboard',
};

const roleStats: Record<string, { label: string; value: string }[]> = {
  SUPER_ADMIN: [
    { label: 'Departments', value: '42' },
    { label: 'Faculty', value: '180' },
    { label: 'Students', value: '12K+' },
  ],
  ADMIN: [
    { label: 'Enrollments', value: '2.4K' },
    { label: 'Fee Collection', value: '92%' },
    { label: 'Pending Forms', value: '18' },
  ],
  CHAIRMAN: [
    { label: 'Reports', value: '24' },
    { label: 'Approvals', value: '7' },
    { label: 'Performance', value: '96%' },
  ],
  EXAM_CELL: [
    { label: 'Exams', value: '14' },
    { label: 'Results', value: '98%' },
    { label: 'Rechecks', value: '11' },
  ],
  TEACHER: [
    { label: 'Subjects', value: '6' },
    { label: 'Classes', value: '12' },
    { label: 'Attendance', value: '94%' },
  ],
  STUDENT: [
    { label: 'Courses', value: '7' },
    { label: 'Attendance', value: '91%' },
    { label: 'Results', value: 'A+' },
  ],
};

function App() {
  const [collegeId, setCollegeId] = useState('superadmin');
  const [password, setPassword] = useState('Password@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleGroups, setRoleGroups] = useState<Record<string, UserListItem[]>>({});
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    collegeId: '',
    email: '',
    firstName: '',
    lastName: '',
    password: 'Password@123',
    role: 'TEACHER',
  });
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<'overview' | 'users' | 'students' | 'teachers' | 'exam-cell' | 'fees' | 'profile'>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('collegePortalUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('collegePortalUser');
      }
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'CHAIRMAN')) {
      fetchUsers();
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        collegeId,
        password,
      });

      const { token, user: loggedInUser } = response.data as {
        token: string;
        user: User;
      };

      localStorage.setItem('collegePortalToken', token);
      localStorage.setItem('collegePortalUser', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Unable to sign in with the provided credentials.'
        : 'Unable to sign in with the provided credentials.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) {
      return;
    }

    setUsersLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const allUsers = response.data.users || [];
      setUsers(allUsers);

      const groupedUsers = allUsers.reduce((acc: Record<string, UserListItem[]>, entry: UserListItem) => {
        const roleKey = entry.role;
        acc[roleKey] = acc[roleKey] ? [...acc[roleKey], entry] : [entry];
        return acc;
      }, {});

      setRoleGroups(groupedUsers);
    } catch (err) {
      console.error('Failed to load users', err);
      setUsers([]);
      setRoleGroups({});
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');
    setIsCreatingUser(true);

    try {
      const token = localStorage.getItem('collegePortalToken');
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        createUserForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCreateUserSuccess(response.data.message || 'User created successfully.');
      setCreateUserForm({
        username: '',
        collegeId: '',
        email: '',
        firstName: '',
        lastName: '',
        password: 'Password@123',
        role: user?.role === 'SUPER_ADMIN' ? 'ADMIN' : 'TEACHER',
      });
      await fetchUsers();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Unable to create user.'
        : 'Unable to create user.';
      setCreateUserError(message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) {
      return;
    }

    setDeleteError('');
    setDeleteSuccess('');
    setIsDeletingUser(userId);

    try {
      const token = localStorage.getItem('collegePortalToken');
      const response = await axios.delete(`${API_URL}/api/auth/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDeleteSuccess(response.data.message || 'User deleted successfully.');
      await fetchUsers();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Unable to delete user.'
        : 'Unable to delete user.';
      setDeleteError(message);
    } finally {
      setIsDeletingUser(null);
    }
  };

  const togglePasswordVisibility = (field: 'oldPassword' | 'newPassword' | 'confirmPassword') => {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('collegePortalToken');
      const response = await axios.post(
        `${API_URL}/api/auth/change-password`,
        {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setPasswordSuccess(response.data.message || 'Password updated successfully.');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords({ oldPassword: false, newPassword: false, confirmPassword: false });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Unable to update password.'
        : 'Unable to update password.';
      setPasswordError(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('collegePortalToken');
    localStorage.removeItem('collegePortalUser');
    setUser(null);
    setError('');
  };

  if (user) {
    const title = roleTitles[user.role] || 'Dashboard';
    const stats = roleStats[user.role] || [
      { label: 'Overview', value: 'Live' },
      { label: 'Tasks', value: '8' },
      { label: 'Alerts', value: '2' },
    ];

    const navItems =
      user.role === 'SUPER_ADMIN' || user.role === 'CHAIRMAN'
        ? [
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'students', label: 'Students' },
            { id: 'teachers', label: 'Teachers' },
            { id: 'exam-cell', label: 'Exam Cell' },
            { id: 'fees', label: 'Fees' },
            { id: 'profile', label: 'Profile' },
          ]
        : user.role === 'ADMIN'
          ? [
              { id: 'overview', label: 'Overview' },
              { id: 'students', label: 'Students' },
              { id: 'teachers', label: 'Teachers' },
              { id: 'fees', label: 'Fees' },
              { id: 'profile', label: 'Profile' },
            ]
          : user.role === 'EXAM_CELL'
            ? [
                { id: 'overview', label: 'Overview' },
                { id: 'exam-cell', label: 'Exam Cell' },
                { id: 'students', label: 'Students' },
                { id: 'fees', label: 'Fees' },
                { id: 'profile', label: 'Profile' },
              ]
            : user.role === 'TEACHER'
              ? [
                  { id: 'overview', label: 'Overview' },
                  { id: 'students', label: 'Students' },
                  { id: 'teachers', label: 'Teachers' },
                  { id: 'profile', label: 'Profile' },
                ]
              : [
                  { id: 'overview', label: 'Overview' },
                  { id: 'fees', label: 'Fees' },
                  { id: 'profile', label: 'Profile' },
                ];

    const analyticsCards = stats.map((item, index) => ({
      label: item.label,
      value: item.value,
      change: ['+8.2%', '+2.1%', '+12.4%', '+1.8%', '+0.0%'][index] || '+0.0%',
    }));

    const chartBars = [42, 58, 46, 72, 66, 88, 92];
    const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const sectionData: Record<string, { title: string; items: { name: string; value: string; accent: string }[] }> = {
      students: {
        title: 'Student Operations',
        items: [
          { name: 'New Admissions', value: '1,240', accent: 'bg-cyan-500' },
          { name: 'Active Students', value: '12,480', accent: 'bg-indigo-500' },
          { name: 'Attendance', value: '94.8%', accent: 'bg-emerald-500' },
        ],
      },
      teachers: {
        title: 'Faculty & Staff',
        items: [
          { name: 'Registered Teachers', value: '480', accent: 'bg-violet-500' },
          { name: 'Classes Assigned', value: '236', accent: 'bg-amber-500' },
          { name: 'Performance', value: '96.4%', accent: 'bg-rose-500' },
        ],
      },
      'exam-cell': {
        title: 'Exam Cell Center',
        items: [
          { name: 'Scheduled Exams', value: '18', accent: 'bg-sky-500' },
          { name: 'Results Published', value: '96%', accent: 'bg-teal-500' },
          { name: 'Recheck Requests', value: '14', accent: 'bg-pink-500' },
        ],
      },
      fees: {
        title: 'Fee Management',
        items: [
          { name: 'Collections', value: '$2.3M', accent: 'bg-emerald-500' },
          { name: 'Pending', value: '$184K', accent: 'bg-orange-500' },
          { name: 'Transactions', value: '8,245', accent: 'bg-blue-500' },
        ],
      },
    };

    const isDark = theme === 'dark';

    return (
      <div className={isDark ? 'dark' : ''}>
        <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} p-4 lg:p-6`}>
          <div className="mx-auto flex max-w-7xl gap-6">
            <aside className={`${isDark ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'} hidden w-72 shrink-0 rounded-3xl border p-5 shadow-2xl lg:block`}>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Campus</p>
                  <h2 className="text-lg font-semibold">Northbridge</h2>
                </div>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivePage(item.id as 'overview' | 'users' | 'students' | 'teachers' | 'exam-cell' | 'fees' | 'profile');
                      setQuickActionsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                      activePage === item.id
                        ? isDark
                          ? 'bg-slate-800 text-white shadow-lg'
                          : 'bg-slate-900 text-white shadow-lg'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
                      {item.id === 'overview' ? 'Home' : item.id === 'users' ? 'Team' : item.id === 'profile' ? 'Info' : item.id === 'students' ? 'Stu' : item.id === 'teachers' ? 'Fac' : item.id === 'exam-cell' ? 'Exam' : 'Fees'}
                    </span>
                  </button>
                ))}
              </nav>

              <div className={`${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'} mt-10 rounded-2xl border p-4`}>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Access</p>
                <div className="mt-3 text-xl font-semibold">{user.role}</div>
                <p className="mt-2 text-sm text-slate-400">{title}</p>
              </div>
            </aside>

            <div className={`${isDark ? 'border-slate-800 bg-slate-900 shadow-2xl' : 'border-slate-200 bg-white shadow-xl'} flex-1 rounded-3xl border`}>
              <header className={`${isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'} flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-center md:justify-between`}>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-secondary">Portal overview</p>
                  <h1 className={`mt-2 text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700'} rounded-full border px-4 py-2 text-sm font-medium`}>
                    {user.firstName} {user.lastName}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setQuickActionsOpen((current) => !current)}
                      className={`${isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'} rounded-xl border px-3 py-2 text-sm font-medium`}
                    >
                      Quick Actions
                    </button>

                    {quickActionsOpen ? (
                      <div className={`${isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-700'} absolute right-0 z-20 mt-2 w-48 rounded-2xl border shadow-xl`}>
                        <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setActivePage('users'); setQuickActionsOpen(false); }}>
                          Manage Users
                        </button>
                        <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setActivePage('fees'); setQuickActionsOpen(false); }}>
                          View Fees
                        </button>
                        <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setTheme((current) => current === 'dark' ? 'light' : 'dark'); setQuickActionsOpen(false); }}>
                          Toggle Theme
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                    className={`${isDark ? 'bg-slate-800 text-yellow-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'} rounded-xl px-3 py-2 text-sm font-medium`}
                  >
                    {isDark ? 'Light' : 'Dark'}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`${isDark ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-700'} rounded-xl px-4 py-2 text-sm font-medium transition`}
                  >
                    Logout
                  </button>
                </div>
              </header>

              <main className="p-6">
                {activePage === 'overview' ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {analyticsCards.map((card) => (
                        <div key={card.label} className={`${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-5`}>
                          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                            <span>{card.label}</span>
                            <span className="text-emerald-500">{card.change}</span>
                          </div>
                          <div className={`mt-5 text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Performance</p>
                            <h2 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Campus Trend</h2>
                          </div>
                          <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-500">+12.8%</div>
                        </div>

                        <div className="mt-6 flex h-44 items-end gap-3">
                          {chartBars.map((bar, index) => (
                            <div key={chartLabels[index]} className="flex flex-1 flex-col items-center gap-2">
                              <div
                                className="w-full rounded-t-2xl bg-gradient-to-t from-primary to-cyan-400"
                                style={{ height: `${bar}%` }}
                              />
                              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{chartLabels[index]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Quick Summary</p>
                        <div className="mt-5 space-y-4">
                          {[
                            { label: 'Admissions', value: '1,240', tone: 'bg-cyan-500' },
                            { label: 'Faculty', value: '480', tone: 'bg-violet-500' },
                            { label: 'Fee Received', value: '$2.3M', tone: 'bg-emerald-500' },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3">
                              <div className="flex items-center gap-3">
                                <span className={`h-2.5 w-2.5 rounded-full ${row.tone}`} />
                                <span className="text-sm text-slate-400">{row.label}</span>
                              </div>
                              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Staff snapshot</p>
                          <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Operations</h3>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-4">
                          <div className="text-sm text-slate-400">Students</div>
                          <div className="mt-2 text-2xl font-semibold text-white">12K+</div>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 p-4">
                          <div className="text-sm text-slate-400">Faculty</div>
                          <div className="mt-2 text-2xl font-semibold text-white">480</div>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-4">
                          <div className="text-sm text-slate-400">Success Rate</div>
                          <div className="mt-2 text-2xl font-semibold text-white">96.7%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activePage === 'users' && (user.role === 'SUPER_ADMIN' || user.role === 'CHAIRMAN') ? (
                  <div className="space-y-6">
                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} rounded-2xl border p-6 shadow-sm`}>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create User</h3>
                          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>
                            Allowed roles: {user.role === 'SUPER_ADMIN' ? 'Admin, Chairman, Exam Cell, Teacher, Student' : 'Admin, Exam Cell, Teacher, Student'}
                          </p>
                        </div>
                      </div>

                      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Username</label>
                          <input value={createUserForm.username} onChange={(e) => setCreateUserForm((current) => ({ ...current, username: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>College ID</label>
                          <input value={createUserForm.collegeId} onChange={(e) => setCreateUserForm((current) => ({ ...current, collegeId: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>First name</label>
                          <input value={createUserForm.firstName} onChange={(e) => setCreateUserForm((current) => ({ ...current, firstName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Last name</label>
                          <input value={createUserForm.lastName} onChange={(e) => setCreateUserForm((current) => ({ ...current, lastName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Email</label>
                          <input type="email" value={createUserForm.email} onChange={(e) => setCreateUserForm((current) => ({ ...current, email: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Password</label>
                          <div className="relative">
                            <input
                              type={showCreatePassword ? 'text' : 'password'}
                              value={createUserForm.password}
                              onChange={(e) => setCreateUserForm((current) => ({ ...current, password: e.target.value }))}
                              className={`${isDark ? 'border-slate-700 bg-slate-900 text-white pr-11' : 'border-slate-200 bg-slate-50 text-slate-900 pr-11'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCreatePassword((current) => !current)}
                              className={`${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} absolute inset-y-0 right-3 flex items-center`}
                              aria-label="Toggle created user password visibility"
                            >
                              {showCreatePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Role</label>
                          <select value={createUserForm.role} onChange={(e) => setCreateUserForm((current) => ({ ...current, role: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                            {(user.role === 'SUPER_ADMIN' ? ['ADMIN', 'CHAIRMAN', 'EXAM_CELL', 'TEACHER', 'STUDENT'] : ['ADMIN', 'EXAM_CELL', 'TEACHER', 'STUDENT']).map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>

                        {createUserError ? <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{createUserError}</div> : null}
                        {createUserSuccess ? <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{createUserSuccess}</div> : null}

                        <div className="md:col-span-2">
                          <button type="submit" disabled={isCreatingUser} className="rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70">
                            {isCreatingUser ? 'Creating user...' : 'Create user'}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} rounded-2xl border p-6 shadow-sm`}>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Users</h3>
                        <button type="button" onClick={() => fetchUsers()} className={`${isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'} rounded-xl border px-3 py-2 text-sm font-medium`}>
                          Refresh
                        </button>
                      </div>

                      {deleteError ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</div> : null}
                      {deleteSuccess ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{deleteSuccess}</div> : null}

                      {usersLoading ? <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading users...</div> : users.length === 0 ? <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No users found.</div> : (
                        <div className="space-y-6">
                          {Object.entries(roleGroups).map(([roleName, roleUsers]) => (
                            <div key={roleName} className={`${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'} rounded-xl border`}>
                              <div className={`${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-100'} border-b px-4 py-3`}>
                                <h4 className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{roleName}</h4>
                              </div>
                              <div className="overflow-x-auto">
                                <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                  <thead>
                                    <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                                      <th className="px-3 py-2 font-medium">Name</th>
                                      <th className="px-3 py-2 font-medium">Username</th>
                                      <th className="px-3 py-2 font-medium">College ID</th>
                                      <th className="px-3 py-2 font-medium">Status</th>
                                      <th className="px-3 py-2 font-medium text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {roleUsers.map((item) => (
                                      <tr key={item.id} className={isDark ? 'border-b border-slate-700' : 'border-b border-slate-100'}>
                                        <td className="px-3 py-3">{item.firstName} {item.lastName}</td>
                                        <td className="px-3 py-3">{item.username}</td>
                                        <td className="px-3 py-3">{item.collegeId}</td>
                                        <td className="px-3 py-3">
                                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.isActive ? 'Active' : 'Inactive'}
                                          </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                          {item.id !== user?.id ? (
                                            <button type="button" onClick={() => handleDeleteUser(item.id)} disabled={isDeletingUser === item.id} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
                                              {isDeletingUser === item.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                          ) : (
                                            <span className={isDark ? 'text-xs text-slate-500' : 'text-xs text-slate-400'}>Self</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : activePage === 'profile' ? (
                  <div className="space-y-6">
                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`${isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-200 text-slate-700'} flex h-16 w-16 items-center justify-center rounded-2xl`}>
                            <UserCircle className="h-10 w-10" />
                          </div>
                          <div>
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm uppercase tracking-[0.2em]`}>Account profile</p>
                            <h3 className={`mt-1 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {user.firstName} {user.lastName}
                            </h3>
                          </div>
                        </div>
                        <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                          Active account
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Role</div>
                          <div className="mt-2 text-lg font-semibold">{user.role}</div>
                        </div>
                        <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>College ID</div>
                          <div className="mt-2 text-lg font-semibold">{user.collegeId}</div>
                        </div>
                        <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Email</div>
                          <div className="mt-2 text-lg font-semibold break-all">{user.email}</div>
                        </div>
                        <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Last login</div>
                          <div className="mt-2 text-lg font-semibold">{new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                        </div>
                      </div>
                    </div>

                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                      <h3 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Change password</h3>

                      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleChangePassword}>
                        <div className="md:col-span-2">
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Current password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.oldPassword ? 'text' : 'password'}
                              value={passwordForm.oldPassword}
                              onChange={(e) => setPasswordForm((current) => ({ ...current, oldPassword: e.target.value }))}
                              className={`${isDark ? 'border-slate-700 bg-slate-900 text-white pr-11' : 'border-slate-200 bg-white text-slate-900 pr-11'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('oldPassword')}
                              className={`${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} absolute inset-y-0 right-3 flex items-center`}
                              aria-label="Toggle current password visibility"
                            >
                              {showPasswords.oldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>New password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.newPassword ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))}
                              className={`${isDark ? 'border-slate-700 bg-slate-900 text-white pr-11' : 'border-slate-200 bg-white text-slate-900 pr-11'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('newPassword')}
                              className={`${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} absolute inset-y-0 right-3 flex items-center`}
                              aria-label="Toggle new password visibility"
                            >
                              {showPasswords.newPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Confirm new password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirmPassword ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))}
                              className={`${isDark ? 'border-slate-700 bg-slate-900 text-white pr-11' : 'border-slate-200 bg-white text-slate-900 pr-11'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('confirmPassword')}
                              className={`${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} absolute inset-y-0 right-3 flex items-center`}
                              aria-label="Toggle confirm password visibility"
                            >
                              {showPasswords.confirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        {passwordError ? (
                          <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {passwordError}
                          </div>
                        ) : null}

                        {passwordSuccess ? (
                          <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {passwordSuccess}
                          </div>
                        ) : null}

                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isChangingPassword ? 'Updating password...' : 'Update password'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : activePage === 'students' ? (
                  <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Department</p>
                        <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Students</h3>
                      </div>
                    </div>

                    {users.filter((entry) => entry.role === 'STUDENT').length === 0 ? (
                      <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No students found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          <thead>
                            <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                              <th className="px-3 py-2 font-medium">Name</th>
                              <th className="px-3 py-2 font-medium">Username</th>
                              <th className="px-3 py-2 font-medium">College ID</th>
                              <th className="px-3 py-2 font-medium">Email</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users
                              .filter((entry) => entry.role === 'STUDENT')
                              .map((entry) => (
                                <tr key={entry.id} className={isDark ? 'border-b border-slate-700' : 'border-b border-slate-100'}>
                                  <td className="px-3 py-3">{entry.firstName} {entry.lastName}</td>
                                  <td className="px-3 py-3">{entry.username}</td>
                                  <td className="px-3 py-3">{entry.collegeId}</td>
                                  <td className="px-3 py-3">{entry.email}</td>
                                  <td className="px-3 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                      {entry.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : activePage === 'teachers' ? (
                  <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Department</p>
                        <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Teachers</h3>
                      </div>
                    </div>

                    {users.filter((entry) => entry.role === 'TEACHER').length === 0 ? (
                      <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No teachers found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          <thead>
                            <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                              <th className="px-3 py-2 font-medium">Name</th>
                              <th className="px-3 py-2 font-medium">Username</th>
                              <th className="px-3 py-2 font-medium">College ID</th>
                              <th className="px-3 py-2 font-medium">Email</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users
                              .filter((entry) => entry.role === 'TEACHER')
                              .map((entry) => (
                                <tr key={entry.id} className={isDark ? 'border-b border-slate-700' : 'border-b border-slate-100'}>
                                  <td className="px-3 py-3">{entry.firstName} {entry.lastName}</td>
                                  <td className="px-3 py-3">{entry.username}</td>
                                  <td className="px-3 py-3">{entry.collegeId}</td>
                                  <td className="px-3 py-3">{entry.email}</td>
                                  <td className="px-3 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                      {entry.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : activePage === 'exam-cell' ? (
                  <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Department</p>
                        <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Exam Cell</h3>
                      </div>
                    </div>

                    {users.filter((entry) => entry.role === 'EXAM_CELL').length === 0 ? (
                      <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No exam cell members found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          <thead>
                            <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                              <th className="px-3 py-2 font-medium">Name</th>
                              <th className="px-3 py-2 font-medium">Username</th>
                              <th className="px-3 py-2 font-medium">College ID</th>
                              <th className="px-3 py-2 font-medium">Email</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users
                              .filter((entry) => entry.role === 'EXAM_CELL')
                              .map((entry) => (
                                <tr key={entry.id} className={isDark ? 'border-b border-slate-700' : 'border-b border-slate-100'}>
                                  <td className="px-3 py-3">{entry.firstName} {entry.lastName}</td>
                                  <td className="px-3 py-3">{entry.username}</td>
                                  <td className="px-3 py-3">{entry.collegeId}</td>
                                  <td className="px-3 py-3">{entry.email}</td>
                                  <td className="px-3 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                      {entry.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Department</p>
                    <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sectionData[activePage]?.title || 'Operations'}</h3>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      {(sectionData[activePage]?.items || []).map((item) => (
                        <div key={item.name} className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={`h-2.5 w-12 rounded-full ${item.accent}`} />
                          <div className="mt-4 text-sm text-slate-400">{item.name}</div>
                          <div className="mt-2 text-2xl font-semibold">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4 lg:p-8">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-card lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden bg-primary p-10 text-white lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(176,141,87,0.35),transparent_35%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Academic Excellence</p>
                  <h1 className="mt-1 text-2xl font-semibold">Northbridge College</h1>
                </div>
              </div>

              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Trusted campus management
                </div>
                <h2 className="max-w-md text-4xl font-semibold leading-tight">
                  Smart systems for modern student success.
                </h2>
                <p className="mt-5 max-w-md text-slate-200">
                  A secure digital campus hub for academics, attendance, fee operations, examination management, and student support.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <BookOpen className="mb-3 h-6 w-6 text-accent" />
                  <div className="text-2xl font-semibold">12K+</div>
                  <div className="text-sm text-slate-200">Students</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <Landmark className="mb-3 h-6 w-6 text-accent" />
                  <div className="text-2xl font-semibold">42</div>
                  <div className="text-sm text-slate-200">Departments</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <ShieldCheck className="mb-3 h-6 w-6 text-accent" />
                  <div className="text-2xl font-semibold">99.8%</div>
                  <div className="text-sm text-slate-200">Security</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-white p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-left">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-secondary">Portal access</p>
                <h3 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back</h3>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="collegeId" className="mb-2 block text-sm font-medium text-slate-700">
                    College ID / Username
                  </label>
                  <input
                    id="collegeId"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    placeholder="superadmin"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                    Remember me
                  </label>
                  <button type="button" className="font-medium text-primary hover:text-primary/80">
                    Forgot Password?
                  </button>
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Demo credentials: <span className="font-semibold">superadmin / Password@123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
