import ProfessionalDashboard from "./ProfessionalDashboard";
import AuthGuard from "./AuthGuard";

// Use the professional dashboard with world-class UI design
const UnifiedDashboard = () => {
  return (
    <AuthGuard>
      <ProfessionalDashboard />
    </AuthGuard>
  );
};

export default UnifiedDashboard;
