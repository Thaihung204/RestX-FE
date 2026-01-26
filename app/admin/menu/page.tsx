"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  available: boolean;
  popular: boolean;
}

export default function MenuPage() {
  const { t } = useTranslation();

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN");
  };

  const [menuItems] = useState<MenuItem[]>([
    {
      id: "1",
      name: "Honi Poke",
      category: "Main Course",
      price: 89000,
      image: "/images/menu/Honi-Poke.png",
      description:
        "Cá hồi tươi sống kết hợp cùng rong biển, dưa chuột, bơ và sốt cay đặc trưng",
      available: true,
      popular: true,
    },
    {
      id: "2",
      name: "Ahi Poke",
      category: "Main Course",
      price: 89000,
      image: "/images/menu/ahi-poke.png",
      description:
        "Cá ngừ đại dương sốt Shoyu, hành tây, mè rang và rau củ tươi mát",
      available: true,
      popular: true,
    },
    {
      id: "3",
      name: "Sriracha Mayo Salmon",
      category: "Main Course",
      price: 89000,
      image: "/images/menu/Sriracha-Mayo-Salmon.png",
      description:
        "Cá hồi nướng phủ sốt Sriracha Mayo cay ngọt hòa quyện hoàn hảo",
      available: true,
      popular: false,
    },
    {
      id: "4",
      name: "Salmon Lover Set",
      category: "Main Course",
      price: 95000,
      image: "/images/menu/Salmon-Lover-Set.png",
      description:
        "Combo gồm 8 miếng nigiri cá hồi tươi và 6 miếng maki cá hồi chuẩn Nhật",
      available: true,
      popular: true,
    },
    {
      id: "5",
      name: "Rainbow Roll",
      category: "Main Course",
      price: 85000,
      image: "/images/menu/Rainbow-Roll.png",
      description:
        "Cuộn sushi 7 màu sắc với nhiều loại cá tươi, bơ và sốt đặc biệt",
      available: true,
      popular: true,
    },
    {
      id: "6",
      name: "Vegan Garden Roll",
      category: "Main Course",
      price: 75000,
      image: "/images/menu/Vegan-Garden-Roll.png",
      description:
        "Cuộn chay với rau củ tươi, bơ, dưa chuột và nấm truffle thuần chay",
      available: true,
      popular: false,
    },
    {
      id: "7",
      name: "Grilled Salmon",
      category: "Main Course",
      price: 289000,
      image: "/placeholder-dish.jpg",
      description: "Fresh Atlantic salmon with herbs",
      available: true,
      popular: false,
    },
    {
      id: "8",
      name: "Truffle Pasta",
      category: "Main Course",
      price: 249000,
      image: "/placeholder-dish.jpg",
      description: "Homemade pasta with truffle sauce",
      available: true,
      popular: false,
    },
    {
      id: "9",
      name: "Caesar Salad",
      category: "Appetizer",
      price: 129000,
      image: "/placeholder-dish.jpg",
      description: "Classic Caesar with croutons",
      available: true,
      popular: false,
    },
    {
      id: "10",
      name: "Beef Steak",
      category: "Main Course",
      price: 359000,
      image: "/placeholder-dish.jpg",
      description: "Premium ribeye steak",
      available: true,
      popular: true,
    },
    {
      id: "11",
      name: "Chocolate Lava Cake",
      category: "Dessert",
      price: 99000,
      image: "/placeholder-dish.jpg",
      description: "Warm chocolate cake with ice cream",
      available: false,
      popular: false,
    },
    {
      id: "12",
      name: "Tom Yum Soup",
      category: "Appetizer",
      price: 89000,
      image: "/placeholder-dish.jpg",
      description: "Spicy Thai soup",
      available: true,
      popular: false,
    },
    {
      id: "13",
      name: "Brown Sugar Milk",
      category: "Beverages",
      price: 45000,
      image: "/images/menu/Brown-Sugar-Milk.png",
      description:
        "Trà sữa trân châu đường đen thơm ngon, ngọt ngào với vị caramel đặc trưng",
      available: true,
      popular: true,
    },
    {
      id: "14",
      name: "Matcha Cream Foam",
      category: "Beverages",
      price: 42000,
      image: "/images/menu/matcha-cold-cream.png",
      description:
        "Trà xanh matcha Nhật Bản phủ lớp kem cheese mềm mịn thơm béo",
      available: true,
      popular: false,
    },
    {
      id: "15",
      name: "Tuna Tataki",
      category: "Appetizer",
      price: 115000,
      image: "/placeholder-dish.jpg",
      description: "Lightly seared tuna with ponzu sauce and sesame",
      available: true,
      popular: true,
    },
    {
      id: "16",
      name: "Miso Soup",
      category: "Appetizer",
      price: 35000,
      image: "/placeholder-dish.jpg",
      description: "Traditional Japanese soup with tofu and seaweed",
      available: true,
      popular: false,
    },
    {
      id: "17",
      name: "Tiramisu",
      category: "Dessert",
      price: 89000,
      image: "/placeholder-dish.jpg",
      description: "Classic Italian dessert with espresso and mascarpone",
      available: true,
      popular: false,
    },
    {
      id: "18",
      name: "Mango Sticky Rice",
      category: "Dessert",
      price: 65000,
      image: "/placeholder-dish.jpg",
      description: "Sweet sticky rice with fresh mango and coconut cream",
      available: true,
      popular: true,
    },
  ]);

  const categories = [
    "All",
    "Main Course",
    "Appetizer",
    "Dessert",
    "Beverages",
  ];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--text)" }}>
              {t("dashboard.menu.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.subtitle")}
            </p>
          </div>
          <Link href="/admin/menu/new">
            <button
              className="px-4 py-2 text-white rounded-lg font-medium transition-all"
              style={{ background: 'linear-gradient(to right, #FF380B, #CC2D08)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #CC2D08, #B32607)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #FF380B, #CC2D08)'}
              suppressHydrationWarning>
              <svg
                className="w-5 h-5 inline-block mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {t("dashboard.menu.add_item")}
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.menu.stats.total_items")}
                </p>
                <p
                  className="text-3xl font-bold mt-1"
                  style={{ color: "var(--text)" }}>
                  {menuItems.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
<<<<<<< HEAD
=======

              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      Available
                    </p>
                    <p className="text-3xl font-bold text-green-500 mt-1">
                      {menuItems.filter((i) => i.available).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--card)',
                  border: '1px solid rgba(255, 56, 11, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      Popular Items
                    </p>
                    <p className="text-3xl font-bold mt-1" style={{color: '#FF380B'}}>
                      {menuItems.filter((i) => i.popular).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'rgba(255,56,11,0.1)'}}>
                    <svg
                      className="w-6 h-6"
                      style={{color: '#FF380B'}}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      Categories
                    </p>
                    <p className="text-3xl font-bold text-purple-500 mt-1">
                      {categories.length - 1}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all`}
                  style={
                    selectedCategory === category
                      ? {background: 'linear-gradient(to right, #FF380B, #CC2D08)', color: 'white'}
                      : {
                          background: 'var(--surface)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }
                  }
                  suppressHydrationWarning>
                  {category === "All"
                    ? t("dashboard.menu.filter")
                    : t(`dashboard.menu.categories.${category.toLowerCase().replace(" ", "_")}`)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden transition-all group"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,56,11,0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                  {/* Image Placeholder */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background: "var(--surface)",
                      aspectRatio: "4/3",
                    }}>
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
                    {item.popular && (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1" style={{backgroundColor: '#FF380B'}}>
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {t("dashboard.menu.popular")}
                      </div>
                    )}
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold">
                          {t("dashboard.menu.out_of_stock")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3
                          className="text-sm font-bold mb-1 line-clamp-1"
                          style={{ color: "var(--text)" }}>
                          {item.name}
                        </h3>
                        <p
                          className="text-xs line-clamp-2"
                          style={{ color: "var(--text-muted)" }}>
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}>
                          Price
                        </p>
                        <p className="text-2xl font-bold" style={{color: '#FF380B'}}>
                          {formatPrice(item.price)}đ
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-medium border border-blue-500/20">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{backgroundColor: 'rgba(255,56,11,0.1)', color: '#FF380B'}}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,56,11,0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,56,11,0.1)'}
                        suppressHydrationWarning>
                        Edit
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: "var(--surface)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                        suppressHydrationWarning>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
>>>>>>> 94d9ab9be690a46cbd51f3c1ec575f8ca86e575d
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.menu.stats.available")}
                </p>
                <p className="text-3xl font-bold text-green-500 mt-1">
                  {menuItems.filter((i) => i.available).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--card)',
              border: '1px solid rgba(255, 56, 11, 0.2)',
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.menu.stats.popular_items")}
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#FF380B' }}>
                  {menuItems.filter((i) => i.popular).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,56,11,0.1)' }}>
                <svg
                  className="w-6 h-6"
                  style={{ color: '#FF380B' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.menu.stats.categories")}
                </p>
                <p className="text-3xl font-bold text-purple-500 mt-1">
                  {categories.length - 1}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all`}
              style={
                selectedCategory === category
                  ? { background: 'linear-gradient(to right, #FF380B, #CC2D08)', color: 'white' }
                  : {
                    background: 'var(--surface)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }
              }
              suppressHydrationWarning>
              {category === "All"
                ? t("dashboard.menu.categories.all")
                : t(`dashboard.menu.categories.${category.toLowerCase().replace(" ", "_").replace("all", "all")}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden transition-all group"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,56,11,0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
              {/* Image Placeholder */}
              <div
                className="relative overflow-hidden"
                style={{
                  background: "var(--surface)",
                  aspectRatio: "4/3",
                }}>
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
                {item.popular && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1" style={{ backgroundColor: '#FF380B' }}>
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {t("dashboard.menu.popular")}
                  </div>
                )}
                {!item.available && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold">
                      {t("dashboard.menu.out_of_stock")}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3
                      className="text-sm font-bold mb-1 line-clamp-1"
                      style={{ color: "var(--text)" }}>
                      {item.name}
                    </h3>
                    <p
                      className="text-xs line-clamp-2"
                      style={{ color: "var(--text-muted)" }}>
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.menu.price")}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: '#FF380B' }}>
                      {formatPrice(item.price)}đ
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-medium border border-blue-500/20">
                    {t(`dashboard.menu.categories.${item.category.toLowerCase().replace(" ", "_")}`)}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ backgroundColor: 'rgba(255,56,11,0.1)', color: '#FF380B' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,56,11,0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,56,11,0.1)'}
                    suppressHydrationWarning>
                    {t("dashboard.menu.edit")}
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: "var(--surface)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                    suppressHydrationWarning>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
