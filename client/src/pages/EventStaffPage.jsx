import { useParams } from 'react-router-dom';
import StaffManager from '../components/StaffManager';

export default function EventStaffPage() {
    const { id } = useParams();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Personal</h2>
            <StaffManager />
        </div>
    );
}
