// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();

    // Basic validation
    if (!formData.username || !formData.password) {
      setFormErrors({
        username: !formData.username ? "Username is required" : "",
        password: !formData.password ? "Password is required" : "",
      });
      return;
    }

    const success = await login(formData.username, formData.password);

    if (success) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!registerData.username) errors.username = "Username is required";
    if (!registerData.password) errors.password = "Password is required";
    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (!registerData.fullName) errors.fullName = "Full name is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const success = await useAuthStore.getState().register(registerData);

    if (success) {
      toast.success("Account created! Please login.");
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">GURO</h1>
          <p className="mt-2 text-sm text-gray-600">IEP Management System</p>
        </div>

        {/* Form */}
        <div className="card">
          {!isRegistering ? (
            <>
              <h2 className="section-header text-center">Sign In</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    setFormErrors({ ...formErrors, username: "" });
                  }}
                  error={formErrors.username}
                  placeholder="Enter your username"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setFormErrors({ ...formErrors, password: "" });
                  }}
                  error={formErrors.password}
                  placeholder="Enter your password"
                  required
                />

                <Button
                  type="submit"
                  loading={isLoading}
                  variant="info"
                  className="w-full font-semibold"
                >
                  Sign In
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsRegistering(true)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Don't have an account? Register
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="section-header text-center">Create Account</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Full Name"
                  value={registerData.fullName}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      fullName: e.target.value,
                    })
                  }
                  error={formErrors.fullName}
                  placeholder="Enter your full name"
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  placeholder="Enter your email"
                />

                <Input
                  label="Username"
                  value={registerData.username}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      username: e.target.value,
                    })
                  }
                  error={formErrors.username}
                  placeholder="Choose a username"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  error={formErrors.password}
                  placeholder="Min. 8 characters"
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  error={formErrors.confirmPassword}
                  placeholder="Confirm your password"
                  required
                />

                <Button
                  type="submit"
                  loading={isLoading}
                  variant="info"
                  className="w-full"
                >
                  Create Account
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsRegistering(false)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
