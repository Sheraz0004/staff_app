import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import SvgIcons from "../../../components/SvgIcons";
import { color } from "../../../color/color";
import Typography from "../../../components/Typography";
import BottomSheetRadioPicker from "../../../constants/bottomSheetRadioPicker";
import AdminEarningCard from "./AdminEarningCard";
import AdminAttendeesCard from "./AdminAttendeesCard";
import AdminEventCard from "./AdminEventCard";
import AdminStatisticsCard from "./AdminStatisticsCard";
import AdminCouponsCard from "./AdminCouponsCard";
import Dropdown from "./components/Dropdown";
import DateRangePicker from "./components/DateRangePicker";
import { styles } from "./adminAllEventsDashboard.styles";

interface RadioOption {
  label: string;
  value: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

const AdminAllEventsDashboard: React.FC = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("Jan 23, 2026");

  const [showEventTypePicker, setShowEventTypePicker] = useState(false);
  const [showTicketingTypePicker, setShowTicketingTypePicker] = useState(false);

  const [selectedEventType, setSelectedEventType] = useState("All");
  const [selectedTicketingType, setSelectedTicketingType] = useState("All");

  const eventTypeOptions: RadioOption[] = [
    { label: "All", value: "All" },
    { label: "Standard", value: "Standard" },
    { label: "Recurring", value: "Recurring" },
    { label: "Multi Day Same Venue", value: "Multi Day Same Venue" },
    { label: "Multi Day Multi Venue", value: "Multi Day Multi Venue" },
  ];

  const ticketingTypeOptions: RadioOption[] = [
    { label: "All", value: "All" },
    { label: "Standard", value: "Standard" },
    { label: "Members", value: "Members" },
    { label: "Early Bird", value: "Early Bird" },
    { label: "Packages", value: "Packages" },
  ];

  const handleDateRangeSelect = ({ startDate, endDate }: DateRange) => {
    const formatDate = (date: Date) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    if (startDate && endDate) {
      if (startDate.getTime() === endDate.getTime()) {
        setSelectedDate(formatDate(startDate));
      } else {
        setSelectedDate(`${formatDate(startDate)} - ${formatDate(endDate)}`);
      }
    } else if (startDate) {
      setSelectedDate(formatDate(startDate));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <SvgIcons.drawerSvg width={24} height={24} fill="transparent" />
          </TouchableOpacity>
          <Typography weight="700" size={20} color={color.brown_3C200A}>
            Dashboard
          </Typography>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellButton}>
            <SvgIcons.bellIcon width={28} height={28} fill="transparent" />
          </TouchableOpacity>
          <View style={styles.headerDivider} />
          <View style={styles.avatar}>
            <SvgIcons.profileImage width={40} height={40} />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.filters}>
          <View style={styles.dropdownWrapper}>
            <Dropdown
              value={selectedEventType}
              onPress={() => setShowEventTypePicker(true)}
            />
          </View>
          <View style={styles.dropdownWrapper}>
            <Dropdown
              value={selectedTicketingType}
              onPress={() => setShowTicketingTypePicker(true)}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <SvgIcons.calendarIcon />
          <Typography
            style={styles.dateSelectorText}
            weight="400"
            size={14}
            color={color.brown_766F6A}
          >
            {selectedDate}
          </Typography>
          <SvgIcons.downArrow />
        </TouchableOpacity>

        <AdminEarningCard />
        <AdminAttendeesCard />
        <AdminEventCard />
        <AdminStatisticsCard />
        <AdminCouponsCard />
      </ScrollView>

      <DateRangePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateRangeSelect={handleDateRangeSelect}
      />

      <BottomSheetRadioPicker
        visible={showEventTypePicker}
        onClose={() => setShowEventTypePicker(false)}
        title="Event Type"
        options={eventTypeOptions}
        selectedValue={selectedEventType}
        onSelect={(option: RadioOption) => setSelectedEventType(option.value)}
      />

      <BottomSheetRadioPicker
        visible={showTicketingTypePicker}
        onClose={() => setShowTicketingTypePicker(false)}
        title="Ticketing Type"
        options={ticketingTypeOptions}
        selectedValue={selectedTicketingType}
        onSelect={(option: RadioOption) =>
          setSelectedTicketingType(option.value)
        }
      />
    </View>
  );
};

export default AdminAllEventsDashboard;
