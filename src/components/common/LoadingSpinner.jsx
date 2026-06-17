// src/components/common/LoadingSpinner.jsx - Updated with daisyUI

const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizes = {
    xs: "loading-xs",
    sm: "loading-sm",
    md: "loading-md",
    lg: "loading-lg",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className={`loading loading-spinner ${sizes[size]}`} />
    </div>
  );
};

export default LoadingSpinner;
