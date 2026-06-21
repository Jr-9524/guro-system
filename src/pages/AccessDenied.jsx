import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";

const AccessDenied = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-6">
    <div className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10 text-base-content">
        <ShieldX className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-bold">Access Denied</h1>
      <p className="mt-2 text-sm leading-6 text-base-content/65">
        You do not have permission to access this section.
      </p>
      <Link to="/dashboard" className="btn btn-primary mt-6">
        Back to Dashboard
      </Link>
    </div>
  </div>
);

export default AccessDenied;