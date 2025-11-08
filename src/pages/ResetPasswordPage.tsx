// src/ResetPasswordPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { KeyRound, CheckCircle2 } from "lucide-react";

const API_URL = "https://blog-node-km1z.onrender.com";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (success) {
      setTimeout(() => navigate("/", { replace: true }), 3000);
    }
  }, [success, navigate]);

  const handleSubmit = async () => {
    if (password !== confirm) return setError("Пароли не совпадают");
    if (password.length < 6) return setError("Минимум 6 символов");

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      } else {
        setError(data.message || "Ошибка");
      }
    } catch {
      setError("Сервер недоступен");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f5f5",
        }}
      >
        <Box
          sx={{
            bgcolor: "white",
            p: 6,
            borderRadius: 3,
            boxShadow: 3,
            textAlign: "center",
          }}
        >
          <CheckCircle2 size={90} className="mx-auto text-green-500" />
          <Typography variant="h5" mt={3}>
            Пароль изменён!
          </Typography>
          <Typography mt={2}>Перенаправление на главную...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
        p: 2,
      }}
    >
      <Box
        sx={{
          bgcolor: "white",
          p: 6,
          borderRadius: 3,
          boxShadow: 3,
          width: "100%",
          maxWidth: 420,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <KeyRound size={60} className="mx-auto text-[#6a11cb]" />
          <Typography variant="h5" mt={2} fontWeight={800}>
            Сброс пароля
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Новый пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Повторите пароль"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: "#6a11cb",
            "&:hover": { bgcolor: "#5a0fb0" },
            py: 1.5,
          }}
        >
          {loading ? "Сохранение..." : "Изменить пароль"}
        </Button>
      </Box>
    </Box>
  );
}
