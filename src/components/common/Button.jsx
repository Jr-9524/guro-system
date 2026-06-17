const Button = ({
  children,
  size = "md",
  disabled = false,
  loading = false,
  icon: Icon,
  className = "",
  onClick,
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn btn-${size} border border-gray-300 px-5 bg-gray-100 transition-colors hover:bg-gray-200 ${loading ? "loading" : ""} ${className}`}
      {...props}
    >
      {!loading && Icon && <Icon className="h-5 w-5" />}
      {children}
    </button>
  );
};

export default Button;

/* USAGE:

<Button onClick={handleClick}>
  Click me
</Button>

<Button size="sm">Small</Button>
<Button size="md">Medium</Button> Default
<Button size="lg">Large</Button>

<Button disabled>
  Disabled
</Button>

<Button loading>
  Saving...
</Button>

<Button icon={Trash}>
  Delete
</Button>

ON CLICK:
<Button onClick={() => console.log("clicked")}>
  Click
</Button>

<Button type="submit">
  Submit
</Button>

<Button className="bg-blue-500 text-white hover:bg-blue-600">
  Custom Button
</Button>

COMBINED EXAMPLE:
<Button
  size="lg"
  icon={Save}
  loading={isSaving}
  onClick={handleSave}
  className="bg-green-500 text-white hover:bg-green-600"
>
  Save Changes
</Button>

*/
