import SvgIcons from "../components/SvgIcons";

interface TicketListItem {
    id: string;
    type: string;
    price: number;
    date: string;
    status: string;
    statusScanned: string;
    name: string;
    dashboardstatus: string;
    imageUrl: any;
}

export const ticketslist: TicketListItem[] = [
    { id: '#12389651342', type: 'Standard Ticket', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'John Doe', dashboardstatus: 'Checked In', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651343', type: 'Standard Ticket', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Asad Ahmad', dashboardstatus: 'No Show', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651344', type: 'VIP Ticket', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Noman Ahmad', dashboardstatus: 'Checked In', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651345', type: 'Standard Ticket', price: 30, date: 'Sun, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Junaid', dashboardstatus: 'No Show', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651346', type: 'Standard Ticket', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Hassan', dashboardstatus: 'No Show', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651347', type: 'VIP Ticket', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Adnan', dashboardstatus: 'Checked In', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651348', type: 'Standard Ticket', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Fahad', dashboardstatus: 'No Show', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651349', type: 'VIP Ticket', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Hussain', dashboardstatus: 'Checked In', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651350', type: 'Standard Ticket', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Taha', dashboardstatus: 'No Show', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651351', type: 'Standard Ticket', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Rohan', dashboardstatus: 'Checked In', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651361', type: 'Members', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Rohan', dashboardstatus: 'Checked In', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651362', type: 'Members', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Rohan', dashboardstatus: 'Checked In', imageUrl: SvgIcons.qRIcon },
    { id: '#12389651363', type: 'Members', price: 30, date: 'Sat, 02 2025', status: 'Check-In', statusScanned: 'Scanned', name: 'Rohan', dashboardstatus: 'Checked In', imageUrl: SvgIcons.qRIcon },
];
