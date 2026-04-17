"use client";

import StatusToggle from "@/components/ui/StatusToggle";
import Link from "next/link";

export interface DishCardItem {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  image: string;
  description: string;
  isActive: boolean;
  available: boolean;
  isBestSeller: boolean;
}

interface DishCardProps {
  item: DishCardItem;
  formatPrice: (price: number) => string;
  onToggleStatus: (item: DishCardItem) => void;
  onAddIngredients: (item: DishCardItem) => void;
  labels: {
    bestSeller: string;
    outOfStock: string;
    noDescription: string;
    price: string;
    edit: string;
    ingredients: string;
    active: string;
    inactive: string;
    activate: string;
    deactivate: string;
    status_icon_label: string;
  };
}

export default function DishCard({
  item,
  formatPrice,
  onToggleStatus,
  onAddIngredients,
  labels,
}: DishCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all group"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(255,56,11,0.5)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }>
      <div
        className="relative overflow-hidden"
        style={{
          background: "var(--surface)",
          aspectRatio: "4/3",
        }}>
        {item.image && item.image !== "/placeholder-dish.jpg" ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-16 h-16"
              style={{ color: "var(--text-muted)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {item.isBestSeller && (
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1"
            style={{ backgroundColor: "var(--primary)", color: "white" }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {labels.bestSeller}
          </div>
        )}
        {!item.isActive && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold">
              {labels.outOfStock}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-bold mb-1 truncate"
              style={{ color: "var(--text)" }}>
              {item.name}
            </h3>
            <p
              className="text-xs truncate"
              title={item.description || labels.noDescription}
              style={{ color: "var(--text-muted)" }}>
              {item.description || labels.noDescription}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ml-2 ${item.isActive ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}`}>
            {item.isActive ? labels.active : labels.inactive}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 gap-1">
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] sm:text-xs"
              style={{ color: "var(--text-muted)" }}>
              {labels.price}
            </p>
            <p
              className="text-[20px] sm:text-base font-semibold"
              style={{ color: "var(--primary)" }}>
              {formatPrice(item.price)}đ
            </p>
          </div>
          <StatusToggle
            checked={item.isActive}
            onChange={() => onToggleStatus(item)}
            ariaLabel={item.isActive ? labels.deactivate : labels.activate}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Link href={`/admin/menu/${item.id}`} className="block">
            <button
              className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: "rgba(255,56,11,0.1)",
                color: "var(--primary)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(255,56,11,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(255,56,11,0.1)")
              }
              suppressHydrationWarning>
              {labels.edit}
            </button>
          </Link>
          <button
            onClick={() => onAddIngredients(item)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)";
              e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            suppressHydrationWarning>
            {labels.ingredients}
          </button>
        </div>
      </div>
    </div>
  );
}
