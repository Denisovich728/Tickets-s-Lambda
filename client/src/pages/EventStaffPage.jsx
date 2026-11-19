import StaffManager from '../components/StaffManager';
import EventNavTabs from '../components/EventNavTabs';

export default function EventStaffPage() {
    return (
        <div className="space-y-6">
            <EventNavTabs />
            <h2 className="text-2xl font-bold text-white tracking-tight">Gestión de Personal del Evento</h2>
            <StaffManager />
        </div>
    );
}
