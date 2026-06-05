"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Pill, Plus, X, Loader2, Edit2, ShoppingBag, Store } from "lucide-react";

export default function PharmacyDashboard() {
  const { data: session } = useSession();
  
  const { data: stockData, isLoading, refetch } = useQuery({
    queryKey: ['pharmacyStock'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/pharmacy/stock', {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data: ordersData, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['pharmacyOrders'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/pharmacy/orders', {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data: profileFetchData } = useQuery({
    queryKey: ['pharmacyProfile'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/pharmacy/profile', {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const stocks = stockData?.stocks || [];
  const orders = ordersData?.orders || [];

  const [activeTab, setActiveTab] = useState("inventory");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setIsUpdatingStatus(orderId);
    try {
      await fetch(`http://localhost:4000/api/pharmacy/order-status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ status })
      });
      await refetchOrders();
    } catch (error) {
      alert("Failed to update status");
    }
    setIsUpdatingStatus(null);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ medicineName: "", quantity: "", price: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [profileData, setProfileData] = useState({ name: "", bio: "", address: "" });

  useEffect(() => {
    if (profileFetchData?.pharmacy) {
      setProfileData({
        name: profileFetchData.pharmacy.name || "",
        bio: profileFetchData.pharmacy.bio || "",
        address: profileFetchData.pharmacy.address || "Not Specified"
      });
    }
  }, [profileFetchData]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/pharmacy/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        alert("Profile Updated Successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch (e) {
      alert("Network error.");
    }
    setIsSubmitting(false);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await fetch('http://localhost:4000/api/pharmacy/stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(session as any)?.accessToken}`
      },
      body: JSON.stringify(formData)
    });
    refetch();
    setIsModalOpen(false);
    setFormData({ medicineName: "", quantity: "", price: "" });
    setIsSubmitting(false);
  };

  const openEdit = (stock: any) => {
    setFormData({ medicineName: stock.medicineName, quantity: stock.quantity.toString(), price: stock.price.toString() });
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Pill className="w-8 h-8 text-primary" />
            Pharmacy Inventory
          </h1>
          <p className="text-muted-foreground mt-1">Manage your medicine stock and pricing.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ medicineName: "", quantity: "", price: "" });
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Update Stock
        </button>
      </div>

      <div className="flex gap-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'inventory' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <Pill className="w-4 h-4 inline-block mr-2 mb-0.5" />
          Inventory
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'orders' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <ShoppingBag className="w-4 h-4 inline-block mr-2 mb-0.5" />
          Orders
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'profile' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <Store className="w-4 h-4 inline-block mr-2 mb-0.5" />
          Store Profile
        </button>
      </div>

      {activeTab === 'inventory' && (
      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-black/40 text-gray-400 text-sm">
                <th className="p-4 font-medium">Medicine Name</th>
                <th className="p-4 font-medium">Quantity</th>
                <th className="p-4 font-medium">Price (₹)</th>
                <th className="p-4 font-medium">Last Updated</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No stock records found.</td>
                </tr>
              ) : (
                stocks.map((stock: any) => (
                  <tr key={stock.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-medium">{stock.medicineName}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${stock.quantity > 10 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {stock.quantity} units
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">₹{stock.price.toFixed(2)}</td>
                    <td className="p-4 text-gray-400 text-sm">{new Date(stock.lastUpdated).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEdit(stock)} className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {isLoadingOrders ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <h3 className="text-xl font-medium text-white mb-2">No Orders Yet</h3>
              <p className="text-gray-400">Incoming orders will appear here.</p>
            </div>
          ) : (
            orders.map((order: any) => (
              <div key={order.id} className="glass-card p-6 rounded-2xl border border-border flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h3 className="text-white font-medium text-lg">{order.medicineName} x{order.quantity}</h3>
                  <p className="text-sm text-gray-400 mt-1">Order ID: {order.id.split('-')[0]}</p>
                  <p className="text-sm text-primary font-medium mt-1">₹{order.totalPrice.toFixed(2)}</p>
                </div>
                <div className="md:text-right">
                  <select
                    disabled={isUpdatingStatus === order.id}
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="bg-input border border-border rounded-lg py-1 px-2 text-xs text-white focus:outline-none focus:border-primary mb-2"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PACKED">Packed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  {isUpdatingStatus === order.id && <Loader2 className="w-3 h-3 animate-spin inline ml-2 text-primary" />}
                  <p className="text-sm text-gray-300">Deliver to:</p>
                  <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileUpdate} className="glass-card p-6 rounded-2xl border border-border max-w-2xl space-y-6">
          <h2 className="text-xl font-semibold text-white">Store Profile Setup</h2>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Shop Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Bio / Description</label>
            <textarea
              rows={3}
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Address</label>
            <textarea
              rows={2}
              value={profileData.address}
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Profile"}
          </button>
        </form>
      )}

      {/* Stock Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Update Medicine Stock</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStock} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Medicine Name</label>
                  <input
                    type="text"
                    required
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Quantity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Stock"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
