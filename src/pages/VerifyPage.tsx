// src/VerifyPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const API_URL = "https://blog-node-km1z.onrender.com";

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Токен отсутствует");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/email-verify/${token}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.message);

          // АВТОЛОГИН
          if (data.token) {
            localStorage.setItem("token", data.token);
          }

          // Авторедирект
          setTimeout(() => {
            navigate(data.redirect || "/", { replace: true });
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Ошибка верификации");
        }
      } catch {
        setStatus("error");
        setMessage("Сервер недоступен");
      }
    };

    verify();
  }, [token, navigate]);

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
          textAlign: "center",
          maxWidth: 500,
          width: "100%",
        }}
      >
        {status === "loading" && (
          <>
            <Loader2
              size={80}
              className="animate-spin mx-auto text-[#6a11cb]"
            />
            <Typography variant="h6" mt={3}>
              Подтверждение email...
            </Typography>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={90} className="mx-auto text-green-500" />
            <Typography
              variant="h4"
              fontWeight={800}
              mt={3}
              sx={{
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Готово!
            </Typography>
            <Typography mt={2} color="text.secondary">
              {message}
            </Typography>
            <Typography mt={2} fontSize="0.9rem" color="gray">
              Перенаправление через 3 секунды...
            </Typography>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={90} className="mx-auto text-red-500" />
            <Typography variant="h4" fontWeight={800} mt={3} color="#d32f2f">
              Ошибка
            </Typography>
            <Typography mt={2} color="text.secondary">
              {message}
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 4 }}
              onClick={() => navigate("/")}
            >
              На главную
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
