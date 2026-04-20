import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  ListRenderItemInfo,
  SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Header from '../../components/header';
import { useApi } from '../../services/useApi';
import { CHECK_IN_SERVICES } from '../../services/CheckInService';
import { color } from '../../color/color';
import { styles } from './index.styles';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScannedBy {
  email: string;
  name: string;
  scannedAt: string;
  staffId: number;
}

interface OrderTicket {
  id: number;
  ticketNumber: string;
  code: string;
  checkinStatus: 'UNSCANNED' | 'SCANNED';
  scanCount: number;
  ticketPrice: number;
  vat: number;
  ticketType: string;
  ticketClass: string;
  category: string;
  ticketHolder: string;
  userEmail: string;
  userPhone: string;
  currency: string;
  location: string;
  message: string | null;
  note: string | null;
  scannedBy: ScannedBy | null;
}

interface OrderDetails {
  orderId: number;
  orderNumber: string;
  status: string;
  boughtBy: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  total: number;
  subtotal: number;
  totalVat: number;
  discountedValue: number | null;
  currency: string;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
  buyerFirstName: string | null;
  buyerLastName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  tickets: OrderTicket[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getBuyerName = (order: OrderDetails): string => {
  const first = order.buyerFirstName ?? '';
  const last = order.buyerLastName ?? '';
  return [first, last].filter(Boolean).join(' ') || 'N/A';
};

const statusStyle = (status: string) => {
  switch (status) {
    case 'PAID':
      return { badge: styles.statusPaid, text: styles.statusTextPaid };
    case 'UNPAID':
      return { badge: styles.statusUnpaid, text: styles.statusTextUnpaid };
    default:
      return { badge: styles.statusCanceled, text: styles.statusTextCanceled };
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metaRow}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue} numberOfLines={1}>{value}</Text>
  </View>
);

const TicketItem = ({ item }: { item: OrderTicket }) => {
  const isScanned = item.checkinStatus === 'SCANNED';
  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketTopRow}>
        <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
        <View style={[styles.scanBadge, isScanned ? styles.scanBadgeScanned : styles.scanBadgeUnscanned]}>
          <Text style={[styles.scanBadgeText, isScanned ? styles.scanBadgeTextScanned : styles.scanBadgeTextUnscanned]}>
            {isScanned ? 'Scanned' : 'Unscanned'}
          </Text>
        </View>
      </View>
      <View style={styles.ticketMeta}>
        <View style={styles.ticketMetaLeft}>
          <Text style={styles.ticketLabel}>Holder</Text>
          <Text style={styles.ticketValue}>{item.ticketHolder || 'N/A'}</Text>
          <Text style={styles.ticketLabel}>Type</Text>
          <Text style={styles.ticketValue}>{item.ticketType || 'N/A'}</Text>
          <Text style={styles.ticketLabel}>Category</Text>
          <Text style={styles.ticketValue}>{item.category || 'N/A'}</Text>
        </View>
        <View style={styles.ticketMetaRight}>
          <Text style={styles.ticketLabel}>Price</Text>
          <Text style={styles.ticketValue}>{item.currency} {item.ticketPrice}</Text>
          <Text style={styles.ticketLabel}>Class</Text>
          <Text style={styles.ticketValue}>{item.ticketClass || 'N/A'}</Text>
          <Text style={styles.ticketLabel}>Scan Count</Text>
          <Text style={styles.ticketValue}>{item.scanCount}</Text>
        </View>
      </View>
      {!!item.note && (
        <>
          <View style={styles.divider} />
          <Text style={styles.ticketLabel}>Note</Text>
          <Text style={[styles.ticketValue, { marginTop: 2 }]}>{item.note}</Text>
        </>
      )}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const OrderDetails: React.FC = () => {
  const route = useRoute<any>();
  const { orderId, orderNumber, eventInfo } = route.params;

  const { loading, response, requestCall: loadDetails } = useApi(
    CHECK_IN_SERVICES.fetchOrderDetails,
    false,
    true,
  );

  useEffect(() => {
    loadDetails(orderId);
  }, [orderId]);

  // API returns a single order object
  const order: OrderDetails | null = response ?? null;
  const st = order ? statusStyle(order.status) : null;

  return (
    <SafeAreaView style={styles.container}>
      <Header eventInfo={eventInfo} showBackButton />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
        </View>
      ) : !order ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Could not load order details.</Text>
        </View>
      ) : (
        <FlatList
          style={styles.content}
          data={order.tickets}
          keyExtractor={(t) => t.id.toString()}
          renderItem={({ item }: ListRenderItemInfo<OrderTicket>) => (
            <TicketItem item={item} />
          )}
          ListHeaderComponent={() => (
            <>
              {/* ── Buyer Info Card ── */}
              <View style={styles.buyerCard}>
                <View style={styles.buyerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.buyerName}>{getBuyerName(order)}</Text>
                    {!!order.buyerEmail && (
                      <Text style={styles.buyerSub}>{order.buyerEmail}</Text>
                    )}
                    {!!order.buyerPhone && (
                      <Text style={styles.buyerSub}>{order.buyerPhone}</Text>
                    )}
                  </View>
                  {st && (
                    <View style={[styles.statusBadge, st.badge]}>
                      <Text style={[styles.statusText, st.text]}>{order.status}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                <MetaRow label="Order Number" value={order.orderNumber} />
                <MetaRow label="Event" value={order.eventTitle} />
                <MetaRow label="Date" value={`${order.eventDate} · ${order.eventStartTime} – ${order.eventEndTime}`} />
                <MetaRow
                  label="Total"
                  value={`${order.currency} ${order.total.toFixed(2)}`}
                />
                {order.discountedValue != null && (
                  <MetaRow label="Discount" value={`${order.currency} ${order.discountedValue.toFixed(2)}`} />
                )}
                {!!order.transactionId && (
                  <MetaRow label="Transaction ID" value={order.transactionId} />
                )}
                {!!order.paymentMethod && (
                  <MetaRow label="Payment" value={order.paymentMethod} />
                )}
              </View>

              {/* ── Tickets header ── */}
              <Text style={styles.sectionHeader}>
                Tickets ({order.tickets.length})
              </Text>
            </>
          )}
          ListEmptyComponent={() => (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No tickets on this order.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default OrderDetails;
