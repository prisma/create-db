import { toast } from "react-hot-toast";

type ToastType = "success" | "error" | "info" | "loading";

const toastStyles = {
  background: "#1a1d24",
  color: "#ffffff",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "500",
  padding: "16px",
};

const iconThemes = {
  success: {
    primary: "#71e8df",
    secondary: "#1a1d24",
  },
  error: {
    primary: "#fc8181",
    secondary: "#1a1d24",
  },
  info: {
    primary: "#a0aec0",
    secondary: "#1a1d24",
  },
  loading: {
    primary: "#16a394",
    secondary: "#1a1d24",
  },
};

const borders = {
  success: "1px solid #71e8df",
  error: "1px solid #fc8181",
  info: "1px solid #a0aec0",
  loading: "1px solid #16a394",
};

export const customToast = (type: ToastType, message: string) => {
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
      return toast.loading(message, { style });
    case "info":
    default:
      return toast(message, {
        style,
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2L2 22h20L12 2Z" stroke="#A0AEC0" stroke-width="2" stroke-linejoin="round"/>
<path d="M12 9V15" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9 12H15" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
      });
  }
};
