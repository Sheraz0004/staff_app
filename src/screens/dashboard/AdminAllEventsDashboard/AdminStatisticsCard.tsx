import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import SvgIcons from '../../../components/SvgIcons';
import { color } from '../../../color/color';
import Typography from '../../../components/Typography';
import { TicketStatBox, MiniStatCard } from '../../../constants/ticketStatBox';
import { selectDashboardData } from '../../../redux/reducers/dashboardReducer';
import { styles } from './AdminStatisticsCard.styles';

const safeFormatAmount = (currency: any, value: any): string => {
  const num = typeof value === 'number' && isFinite(value) ? value : 0;
  const formatted = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency ?? 'GHS'} ${formatted}`;
};

const AdminStatisticsCard: React.FC = () => {
  const dashboardData = useSelector(selectDashboardData);

  const currency = dashboardData?.currency ?? 'GHS';
  const sold = dashboardData?.tickets?.sold ?? { count: 0, grossValue: 0, netValue: 0 };
  const refunded = dashboardData?.tickets?.refunded ?? { count: 0, value: 0 };
  const cancelled = dashboardData?.tickets?.cancelled ?? { count: 0, value: 0 };

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
        count={String(sold?.count ?? 0)}
        grossAmount={safeFormatAmount(currency, sold?.grossValue)}
        netAmount={safeFormatAmount(currency, sold?.netValue)}
      />

      <View style={styles.statRow}>
        <MiniStatCard
          icon={<SvgIcons.ticketsRefunded width={32} height={32} />}
          label="Tickets Refunded"
          count={String(refunded?.count ?? 0)}
          amount={safeFormatAmount(currency, refunded?.value)}
        />
        <MiniStatCard
          icon={<SvgIcons.ticketCanceled width={32} height={32} />}
          label="Tickets Canceled"
          count={String(cancelled?.count ?? 0)}
          amount={safeFormatAmount(currency, cancelled?.value)}
        />
      </View>
    </View>
  );
};

export default AdminStatisticsCard;
