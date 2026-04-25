import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTodayData, dataDate } from '../data/todayData';

export default function TodayData() {
  const { user, isAdmin, isManager, visibleRegions } = useAuth();
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  const allData = useMemo(() => getTodayData(), []);

  const filteredData = useMemo(() => {
    let data = allData;
    if (isAdmin) {
      if (regionFilter !== 'ALL') data = data.filter(d => d.region === regionFilter);
    } else if (isManager) {
      data = data.filter(d => visibleRegions.includes(d.region));
      if (regionFilter !== 'ALL' && visibleRegions.includes(regionFilter)) {
        data = data.filter(d => d.region === regionFilter);
      }
    } else {
      if (user?.stores?.length) {
        const names = new Set(user.stores.map(s => s.name));
        data = data.filter(d => names.has(d.storeName));
      }
    }
    return data;
  }, [allData, isAdmin, isManager, visibleRegions, regionFilter, user]);

  const fmt = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toLocaleString();

  const allRegions = useMemo(() => {
    if (isAdmin) {
      const rs = new Set(allData.map(d => d.region));
      return Array.from(rs).sort();
    }
    return visibleRegions;
  }, [isAdmin, visibleRegions, allData]);

  const totalSummary = useMemo(() => {
    const stores = new Set(filteredData.map(d => d.storeName));
    return {
      storeRecovery: filteredData.reduce((s, d) => s + d.storeRecovery, 0),
      douyinRecovery: filteredData.reduce((s, d) => s + d.douyinRecovery, 0),
      nonDeliveryUsers: filteredData.reduce((s, d) => s + d.nonDeliveryUsers, 0),
      storeCount: stores.size,
    };
  }, [filteredData]);

  const regionTree = useMemo(() => {
    const regionMap = new Map<string, {
      storeRecovery: number;
      douyinRecovery: number;
      nonDeliveryUsers: number;
      storeCount: number;
      stores: Map<string, {
        storeRecovery: number;
        douyinRecovery: number;
        nonDeliveryUsers: number;
        employees: typeof filteredData;
      }>;
    }>();

    filteredData.forEach(d => {
      if (!regionMap.has(d.region)) {
        regionMap.set(d.region, { storeRecovery: 0, douyinRecovery: 0, nonDeliveryUsers: 0, storeCount: 0, stores: new Map() });
      }
      const region = regionMap.get(d.region)!;
      region.storeRecovery += d.storeRecovery;
      region.douyinRecovery += d.douyinRecovery;
      region.nonDeliveryUsers += d.nonDeliveryUsers;

      if (!region.stores.has(d.storeName)) {
        region.stores.set(d.storeName, { storeRecovery: 0, douyinRecovery: 0, nonDeliveryUsers: 0, employees: [] });
        region.storeCount++;
      }
      const store = region.stores.get(d.storeName)!;
      store.storeRecovery += d.storeRecovery;
      store.douyinRecovery += d.douyinRecovery;
      store.nonDeliveryUsers += d.nonDeliveryUsers;
      store.employees.push(d);
    });

    return Array.from(regionMap.entries())
      .sort((a, b) => b[1].storeRecovery - a[1].storeRecovery)
      .map(([regionName, regionData]) => ({
        name: regionName,
        ...regionData,
        storeList: Array.from(regionData.stores.entries())
          .sort((a, b) => b[1].storeRecovery - a[1].storeRecovery)
          .map(([storeName, storeData]) => ({
            name: storeName,
            ...storeData,
          })),
      }));
  }, [filteredData]);

  return (
    <div className="px-3 pt-3 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold" style={{ color: '#3D3A39' }}>今日实时数据</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#8C8685' }}>{dataDate}</span>
          {allRegions.length > 1 && (
            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="px-2 py-1 rounded-lg text-xs"
              style={{ background: '#F9F9F9', border: '1px solid #E8E5E3', color: '#3D3A39' }}
            >
              <option value="ALL">全部区域</option>
              {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <SummaryCard label="门店回收额" value={'¥' + fmt(totalSummary.storeRecovery)} color="#D4C524" />
        <SummaryCard label="抖音回收额" value={'¥' + fmt(totalSummary.douyinRecovery)} color="#F59E0B" />
        <SummaryCard label="非交付用户" value={totalSummary.nonDeliveryUsers.toLocaleString()} color="#3D3A39" />
        <SummaryCard label="涉及门店" value={totalSummary.storeCount.toLocaleString()} color="#8C8685" />
      </div>

      {/* 三级全量展开 */}
      {regionTree.map(region => (
        <div key={region.name} className="rounded-2xl mb-3 overflow-hidden" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
          {/* 区域头 */}
          <div className="px-3 py-2.5 flex items-center justify-between" style={{ background: '#FAFAFA' }}>
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 rounded-full" style={{ background: '#D4C524' }} />
              <span className="text-sm font-bold" style={{ color: '#3D3A39' }}>{region.name}</span>
              <span className="text-[10px]" style={{ color: '#B8B4B2' }}>{region.storeCount}店</span>
            </div>
            <div className="flex gap-3 text-[11px]">
              <span>回收 <b style={{ color: '#D4C524' }}>¥{fmt(region.storeRecovery)}</b></span>
              <span>抖音 <b style={{ color: '#F59E0B' }}>¥{fmt(region.douyinRecovery)}</b></span>
            </div>
          </div>

          {/* 门店 + 店员 */}
          {region.storeList.map(store => (
            <div key={store.name}>
              <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid #F5F3F1' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#F5F3F1', color: '#6B6664' }}>{store.name}</span>
                  <span className="text-[10px]" style={{ color: '#B8B4B2' }}>{store.employees.length}人</span>
                </div>
                <div className="flex gap-3 text-[11px]">
                  <span style={{ color: '#D4C524' }}>¥{fmt(store.storeRecovery)}</span>
                  <span style={{ color: '#F59E0B' }}>¥{fmt(store.douyinRecovery)}</span>
                </div>
              </div>

              {store.employees.map((emp, idx) => (
                <div key={idx} className="px-3 py-1.5 flex items-center justify-between" style={{ borderBottom: idx < store.employees.length - 1 ? '1px solid #FAF8F6' : 'none' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: '#3D3A39' }}>{emp.operator || '(未知)'}</span>
                    {emp.tradeType && <span className="text-[10px]" style={{ color: '#B8B4B2' }}>{emp.tradeType}</span>}
                  </div>
                  <div className="flex gap-3 text-[11px]">
                    <span style={{ color: '#D4C524' }}>¥{fmt(emp.storeRecovery)}</span>
                    <span style={{ color: '#F59E0B' }}>¥{fmt(emp.douyinRecovery)}</span>
                    <span style={{ color: '#6B6664' }}>{emp.nonDeliveryUsers}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {filteredData.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
          <p className="text-sm" style={{ color: '#8C8685' }}>暂无数据</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
      <div className="text-[11px] mb-0.5" style={{ color: '#8C8685' }}>{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );
}