import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, ok: null, error: null });
  const [devToken, setDevToken] = useState("");

  useEffect(() => {
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (publicKey) emailjs.init(publicKey);
  }, []);

  const sendResetEmail = async ({ toEmail, resetToken }) => {
    const origin = window.location.origin.replace(/\/+$/, "");
    const resetLink = `${origin}/reset?token=${encodeURIComponent(resetToken)}`;

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      throw new Error("Faltan VITE_EMAILJS_SERVICE_ID o VITE_EMAILJS_TEMPLATE_ID");
    }

    const templateParams = {
      to_email: toEmail,
      to_name: toEmail.split("@")[0],
      reset_link: resetLink,
    };

    await emailjs.send(serviceId, templateId, templateParams);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, ok: null, error: null });
    setDevToken("");

    try {
      const backend = import.meta.env.VITE_BACKEND_URL;
      if (!backend) throw new Error("Falta VITE_BACKEND_URL en .env");
      const base = backend.replace(/\/+$/, "");

      const resp = await fetch(`${base}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.message || "No se pudo procesar la solicitud");

      if (data?.reset_token_dev_only) {
        await sendResetEmail({ toEmail: email, resetToken: data.reset_token_dev_only });
        setDevToken(data.reset_token_dev_only)
      }

      setStatus({
        loading: false,
        ok: data?.message || "Si el correo existe, te enviamos un enlace.",
        error: null,
      });
    } catch (err) {
      setStatus({ loading: false, ok: null, error: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Restaurar contraseña
          </h2>
          <p className="text-gray-500 mb-6 text-center">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="tuemail@ejemplo.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={status.loading}
              className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {status.loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>

          {status.ok && (
            <div className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-lg text-center">
              {status.ok}
            </div>
          )}
          {status.error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
              {status.error}
            </div>
          )}

          {/* {devToken && (
            <div className="mt-6">
              <p className="text-xs text-gray-400 mb-2">🔑 Token dev (solo pruebas):</p>
              <code className="block text-xs bg-gray-100 p-2 rounded break-all">
                {devToken}
              </code>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};
