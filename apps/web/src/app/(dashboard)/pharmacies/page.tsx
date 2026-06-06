"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Pill, Star, Loader2, X, MapPin, ShoppingBag, Store, Clock } from "lucide-react";

export default function PharmaciesDashboard() {
  const { data: session } = useSession();
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pharmacyList'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/pharmacy/list`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data: myOrdersData } = useQuery({
    queryKey: ['myPharmacyOrders'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/pharmacy/my-orders`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const pharmacies = data?.pharmacies || [];
  const myOrders = myOrdersData?.orders || [];

  const [activeTab, setActiveTab] = useState("pharmacies");
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderData, setOrderData] = useState({ quantity: "1", deliveryAddress: "" });

  const openOrder = (pharmacyId: string, medicine: any) => {
    setSelectedPharmacyId(pharmacyId);
    setSelectedMedicine(medicine);
    setOrderData({ quantity: "1", deliveryAddress: "" });
    setIsOrderModalOpen(true);
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/pharmacy/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(session as any)?.accessToken}`
      },
      body: JSON.stringify({
        pharmacyId: selectedPharmacyId,
        medicineName: selectedMedicine.medicineName,
        quantity: parseInt(orderData.quantity),
        deliveryAddress: orderData.deliveryAddress
      })
    });
    
    if (res.ok) {
      alert("Order placed successfully!");
      refetch();
      setIsOrderModalOpen(false);
    } else {
      const error = await res.json();
      alert(`Error: ${error.error}`);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary" />
            Order Medicines
          </h1>
          <p className="text-muted-foreground mt-1">Browse local pharmacies and order delivery.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('pharmacies')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pharmacies' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <Store className="w-4 h-4 inline-block mr-2 mb-0.5" />
          Browse Pharmacies
        </button>
        <button 
          onClick={() => setActiveTab('my-orders')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'my-orders' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <ShoppingBag className="w-4 h-4 inline-block mr-2 mb-0.5" />
          My Orders
        </button>
      </div>

      {activeTab === 'my-orders' && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <h3 className="text-xl font-medium text-white mb-2">No Orders Yet</h3>
              <p className="text-gray-400 mb-6">You haven't ordered any medicines yet.</p>
            </div>
          ) : (
            myOrders.map((order: any) => (
              <div key={order.id} className="glass-card p-6 rounded-2xl border border-border flex flex-col md:flex-row justify-between gap-4 items-center">
                <div>
                  <h3 className="text-white font-medium text-lg">{order.medicineName} (x{order.quantity})</h3>
                  <p className="text-sm text-gray-400 mt-1">Ordered from: {order.pharmacy.name}</p>
                  <p className="text-sm text-gray-500 mt-1">Total: ₹{order.totalPrice.toFixed(2)}</p>
                </div>
                <div className="md:text-right">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-medium inline-block mb-2 ${
                    order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-500' :
                    order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'pharmacies' && (
      <>
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pharmacies.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <h3 className="text-xl font-medium text-white mb-2">No Pharmacies Available</h3>
          <p className="text-gray-400 mb-6">There are currently no pharmacies registered on the platform.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pharmacies.map((pharm: any) => {
            const avgRating = pharm.avgRating ? pharm.avgRating.toFixed(1) : "New";

            return (
              <motion.div
                key={pharm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-border"
              >
                <div className="flex justify-between items-start mb-6 border-b border-border pb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{pharm.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-gray-400 text-sm">
                      <MapPin className="w-4 h-4" />
                      {pharm.address}
                    </div>
                    {pharm.bio && <p className="text-sm text-gray-500 mt-3 max-w-2xl">{pharm.bio}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg font-medium">
                      <Star className="w-4 h-4 fill-current" />
                      {avgRating} Rating
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Available Stock</h4>
                  {pharm.stocks.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No medicines available right now.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {pharm.stocks.map((stock: any) => (
                        <div key={stock.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-border/50 hover:border-primary/50 transition-colors">
                          <div>
                            <p className="text-white font-medium">{stock.medicineName}</p>
                            <p className="text-sm text-primary font-bold mt-1">₹{stock.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">{stock.quantity > 0 ? `${stock.quantity} in stock` : 'Out of stock'}</p>
                          </div>
                          <button 
                            onClick={() => openOrder(pharm.id, stock)}
                            disabled={stock.quantity <= 0}
                            className="bg-primary hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Buy
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && selectedMedicine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Place Order</h2>
                <button onClick={() => setIsOrderModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-medium">{selectedMedicine.medicineName}</h3>
                  <p className="text-sm text-primary">₹{selectedMedicine.price.toFixed(2)} per unit</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-lg font-bold text-white">₹{(selectedMedicine.price * parseInt(orderData.quantity || "0")).toFixed(2)}</p>
                </div>
              </div>

              <form onSubmit={handleOrder} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Quantity (Max {selectedMedicine.quantity})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedMedicine.quantity}
                    value={orderData.quantity}
                    onChange={(e) => setOrderData({ ...orderData, quantity: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Delivery Address</label>
                  <textarea
                    rows={3}
                    required
                    value={orderData.deliveryAddress}
                    onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Enter full address for delivery..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Order"}
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
