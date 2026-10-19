import { toast } from "react-hot-toast";

type ToastType = "success" | "error" | "info" | "loading";

// Toasts on the brand palette: white card, ink text, a prism-colour edge for
// the state (cyan success, red error, yellow while working).
const toastStyles = {
  background: "#ffffff",
  color: "#151515",
  borderRadius: "9999px",
  fontSize: "14px",
  fontWeight: "500",
  padding: "10px 16px",
  boxShadow: "0 8px 24px rgba(21, 21, 21, 0.08)",
};

const iconThemes = {
  success: {
    primary: "#00bbcb", // prism-cyan-500
    secondary: "#ffffff",
  },
  error: {
    primary: "#d02344", // prism-red-600
    secondary: "#ffffff",
  },
  info: {
    primary: "#646567",
    secondary: "#ffffff",
  },
  loading: {
    primary: "#eaa700", // prism-yellow-400
    secondary: "#fcedc2",
  },
};

const borders = {
  success: "1px solid #7be7f0",
  error: "1px solid #ff9fa4",
  info: "1px solid #e5e5e5",
  loading: "1px solid #f8da85",
};

export const customToast = (type: ToastType, message: string): string => {
  const style = {
    ...toastStyles,
    border: borders[type],
  };

  const iconTheme = iconThemes[type];

  const options = {
    style,
    iconTheme,
  };

  switch (type) {
    case "success":
      return toast.success(message, options);
    case "error":
      return toast.error(message, options);
    case "loading":
      return toast.loading(message, { style, iconTheme, duration: Infinity });
    case "info":
    default:
      return toast(message, {
        style,
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2L2 22h20L12 2Z" stroke="#646567" stroke-width="2" stroke-linejoin="round"/>
<path d="M12 9V15" stroke="#646567" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9 12H15" stroke="#646567" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
      });
  }
};
