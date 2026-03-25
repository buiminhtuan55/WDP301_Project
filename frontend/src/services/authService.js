/**
 * Authentication Service
 * Quản lý authentication state và token
 */

class AuthService {
  constructor() {
    this.tokenKey = 'accessToken';
    this.userKey = 'user';
  }

  /**
   * Lưu token và user info
   */
  setAuthData(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem('token', token);
    localStorage.setItem(this.userKey, JSON.stringify(user));

    // Đồng bộ role để các trang admin/staff dùng lại
    if (user?.role) {
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('role', JSON.stringify({ role: user.role }));

      const normalizedRole = (user.role || '').toLowerCase();
      const isStaff =
        normalizedRole === 'admin' ||
        normalizedRole === 'lv1' ||
        normalizedRole === 'lv2';
      localStorage.setItem('isStaff', isStaff ? 'true' : 'false');
    }
  }

  /**
   * Lấy token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Lấy user info
   */
  getUser() {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Xóa auth data (bao gồm tất cả key liên quan đến user/staff/admin)
   */
  clearAuthData() {
    const keysToRemove = [
      this.tokenKey,
      this.userKey,
      'token',
      'accessToken',
      'isStaff',
      'userRole',
      'role',
      'staff',
      'customerSearch',
      'customerStatusFilter',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Dọn sessionStorage cho các flow tạm thời (VD: staffReturnPage)
    try { sessionStorage.clear(); } catch (_) {}
  }

  /**
   * Logout và chuyển hướng đến path được chỉ định
   */
  logoutTo(path = '/login') {
    this.clearAuthData();
    window.location.href = path;
  }

  /**
   * Logout (mặc định về /login)
   */
  logout() {
    this.logoutTo('/login');
  }

  /**
   * Cập nhật user info
   */
  updateUser(userData) {
    const currentUser = this.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
    }
  }
}

// Tạo instance duy nhất
const authService = new AuthService();

export default authService;
