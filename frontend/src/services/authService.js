import api from "./apiService";

const persistAuth = (payload) => {
  localStorage.setItem("accessToken", payload.accessToken);
  localStorage.setItem("user", JSON.stringify(payload.user));
  localStorage.setItem("role", JSON.stringify({ role: payload.user.role }));
  localStorage.setItem("userRole", payload.user.role);
};

const getApiErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || fallbackMessage;
};

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post("/auth/login", { email, password });
      persistAuth(response.data);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Dang nhap that bai"));
    }
  },

  async adminLogin(email, password) {
    const payload = await this.login(email, password);
    const role = String(payload?.user?.role || "").toLowerCase();
    const allowRoles = ["admin", "lv1", "lv2"];

    if (!allowRoles.includes(role)) {
      this.logout();
      throw new Error("Tai khoan khong co quyen admin/staff");
    }

    return payload;
  },

  async register(formData) {
    try {
      const response = await api.post("/auth/register", formData);
      persistAuth(response.data);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Dang ky that bai"));
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get("/api/me");
      return response.data?.user;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Khong lay duoc thong tin user"));
    }
  },

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("userRole");
  },
};

export default authService;
