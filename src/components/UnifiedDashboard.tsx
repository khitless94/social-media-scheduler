import ModernDashboard from "./ModernDashboard";
import AuthGuard from "./AuthGuard";

// Modern Dashboard with AuthGuard
const UnifiedDashboard = () => {
  return (
    <AuthGuard>
      <ModernDashboard />
    </AuthGuard>
  );
};

export default UnifiedDashboard;
