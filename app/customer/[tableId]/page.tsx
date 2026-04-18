"use client";

import CartModal from "@/components/customer/CartModal";
import CustomerFooter from "@/components/customer/CustomerFooter";
import MenuCTA from "@/components/customer/MenuCTA";
import RestaurantHeader from "@/components/customer/RestaurantHeader";
import WelcomeCard from "@/components/customer/WelcomeCard";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useTheme } from "@/lib/hooks/useTheme";
import customerService, {
  CustomerResponseDto,
} from "@/lib/services/customerService";
import { ConfigProvider, Grid, Space, Typography, message, theme } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const { Text } = Typography;
const { useBreakpoint } = Grid;

function isValidGuid(id: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    id,
  );
}

export default function CustomerHomePageByTable() {
  const router = useRouter();
  const screens = useBreakpoint();
  const isSmallPhone = !screens.sm;
  const pageHorizontalPadding = isSmallPhone ? 12 : 16;
  const sectionSpacing = isSmallPhone ? 20 : 24;
  const params = useParams();
  const rawTableId = params?.tableId;
  const tableId = Array.isArray(rawTableId) ? rawTableId[0] : rawTableId || "";

  const { user } = useAuth();
  const { tenant } = useTenant();
  const { setOrderContext } = useCart();
  const { mode: themeMode } = useTheme();
  const [, contextHolder] = message.useMessage();

  const [customerProfile, setCustomerProfile] =
    useState<CustomerResponseDto | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [openProfileSignal, setOpenProfileSignal] = useState(0);

  useEffect(() => {
    if (!isValidGuid(tableId)) {
      router.replace("/404");
    }
  }, [tableId, router]);

  useEffect(() => {
    if (!isValidGuid(tableId)) return;

    setOrderContext({
      tableId,
      customerId: customerProfile?.id || user?.customerId || undefined,
    });
  }, [tableId, customerProfile?.id, user?.customerId, setOrderContext]);

  const loadCustomerProfile = useCallback(async () => {
    if (!user) return;

    try {
      let profile = null;

      if (user.customerId) {
        profile = await customerService.getCustomerProfile(user.customerId);
      } else if (user.email) {
        profile = await customerService.getCustomerByEmail(user.email);
      }

      if (profile) {
        setCustomerProfile(profile);
        setCustomerName(profile.fullName);
        setPhoneNumber(profile.phoneNumber || "");
        setAvatarUrl(
          profile.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=4F46E5&color=fff`,
        );
      }
    } catch (error) {
      console.error("Failed to load customer profile:", error);
    }
  }, [user]);

  useEffect(() => {
    loadCustomerProfile();
  }, [loadCustomerProfile]);

  const handleViewMenu = () => {
    router.push(`/menu/${tableId}`);
  };

  return (
    <ConfigProvider
        theme={{
          algorithm:
            themeMode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: "var(--primary)",
            fontFamily: "'Playfair Display', 'Inter', sans-serif",
            borderRadius: 8,
          },
          components: {
            Message: {
              contentBg: "var(--surface)",
              colorText: "var(--text)",
              borderRadiusLG: 12,
              boxShadow: "var(--shadow-md)",
              fontSize: 13,
              contentPadding: "6px 12px",
            },
            Input: {
              colorBgContainer: "var(--surface)",
              colorBorder: "var(--border)",
              activeBorderColor: "var(--primary)",
              hoverBorderColor: "var(--primary)",
            },
            DatePicker: {
              colorBgContainer: "var(--surface)",
              colorBorder: "var(--border)",
            },
            Modal: {
              contentBg: "transparent",
              boxShadow: "none",
            },
          },
        }}
        form={{ requiredMark: false }}>
        <div
          style={{
            minHeight: "100vh",
            background: "var(--bg-base)",
            backgroundImage: `
              radial-gradient(circle at 0% 0%, var(--primary-soft), transparent 45%),
              radial-gradient(circle at 100% 100%, var(--primary-faint), transparent 45%)
            `,
            paddingBottom: isSmallPhone ? 96 : 88,
          }}>
          {contextHolder}

          <section
            style={{ position: "relative", marginBottom: -48, zIndex: 1 }}>
            <div
              style={{
                height: "clamp(260px, 40vh, 400px)",
                background:
                  "url(/images/customer/customer.png) no-repeat center center / cover",
                position: "relative",
              }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, var(--modal-overlay) 0%, var(--bg-base) 100%)",
                }}
              />
            </div>

            <div
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: `0 ${pageHorizontalPadding}px`,
                position: "absolute",
                bottom: isSmallPhone ? 52 : 64,
                left: 0,
                right: 0,
              }}>
              <RestaurantHeader
                restaurantName={
                  tenant?.businessName || tenant?.name || "Restaurant"
                }
                phone={tenant?.businessPrimaryPhone || "1900 6868"}
                hours={tenant?.businessOpeningHours || "08:00 - 23:00"}
              />
            </div>
          </section>

          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: `0 ${pageHorizontalPadding}px`,
              position: "relative",
              zIndex: 2,
            }}>
            <Space
              orientation="vertical"
              size={sectionSpacing}
              style={{ width: "100%" }}>
              <WelcomeCard
                customerName={customerName}
                rank={customerProfile?.membershipLevel}
                onClick={() => setOpenProfileSignal((prev) => prev + 1)}
              />

              <MenuCTA onViewMenu={handleViewMenu} />
            </Space>

            <div
              style={{
                textAlign: "center",
                marginTop: isSmallPhone ? 24 : 32,
                opacity: 0.5,
              }}>
              <Text
                style={{
                  color: "var(--text-muted)",
                  fontSize: isSmallPhone ? 11 : 12,
                  letterSpacing: isSmallPhone ? 1.5 : 2,
                  textTransform: "uppercase",
                }}>
                {tenant?.businessName ||
                  tenant?.name ||
                  "Restaurant Experience"}
              </Text>
            </div>
          </div>
        </div>

        <CustomerFooter
          customerProfile={customerProfile}
          customerName={customerName}
          phoneNumber={phoneNumber}
          avatarUrl={avatarUrl}
          onProfileUpdate={loadCustomerProfile}
          openProfileSignal={openProfileSignal}
          position="sticky"
          tableId={tableId}
        />
        <CartModal />
      </ConfigProvider>
  );
}
