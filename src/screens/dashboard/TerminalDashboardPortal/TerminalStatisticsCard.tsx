import React from 'react';
import { View } from 'react-native';
import SvgIcons from '../../../components/SvgIcons';
import { color } from '../../../color/color';
import Typography from '../../../components/Typography';
import { TicketStatBox, MiniStatCard } from '../../../constants/ticketStatBox';
import { styles } from './TerminalStatisticsCard.styles';

const TerminalStatisticsCard: React.FC = () => {
    return (
        <View style={styles.card}>
            <Typography
                style={styles.cardTitle}
                weight="700"
                size={13}
                color={color.placeholderTxt_24282C}
            >
                Statistics
            </Typography>

            <TicketStatBox
                icon={<SvgIcons.ticketIcon width={32} height={32} />}
                label="Ticket Sold"
                count="102"
                grossAmount="GHS 100,000.00"
                netAmount="GHS 95,000.00"
            />

            <View style={styles.statRow}>
                <MiniStatCard
                    icon={<SvgIcons.ticketsRefunded width={32} height={32} />}
                    label="Tickets Refunded"
                    count="102"
                    amount="GHS 50,0000.00"
                />
                <MiniStatCard
                    icon={<SvgIcons.ticketCanceled width={32} height={32} />}
                    label="Tickets Canceled"
                    count="102"
                    amount="GHS 20,0000.00"
                />
            </View>
        </View>
    );
};

export default TerminalStatisticsCard;
