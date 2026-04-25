import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { rankingData } from '../data/rankingData';

type GradeFilter = 'ALL' | 'A' | 'B' | 'C' | 'D';

export default function Ranking() {
  const { user, isAdmin, isManager, isOperator, managedRegions } = useAuth();
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('ALL');
  const [searchName, setSearchName] = useState('');
  const [searchResult, setSearchResult] = useState<typeof rankingData | null>(null);

  const visibleData = useMemo(() => {
    if (isAdmin) return rankingData;
    if (isManager) return rankingData.filter(p => managedRegions.includes(p.region));
    if (user) return rankingData.filter(p => p.name === user.name);
    return [];
  }, [isAdmin, isManager, managedRegions, user]);

  const filteredData = useMemo(() => {
    if (gradeFilter === 'ALL') return visibleData;
    return visibleData.filter(p => p.grade === gradeFilter);
  }, [visibleData, gradeFilter]);

  const gradeCounts = useMemo(() => {
    const counts = { ALL: visibleData.length, A: 0, B: 0, C: 0, D: 0 };
    visibleData.forEach(p => { if (p.grade in counts) counts[p.grade as 'A']++; });
    return counts;
  }, [visibleData]);

  const handleSearch = () => {
    if (!searchName.trim()) { setSearchResult(null); return; }
    const found = visibleData.filter(p => p.name.includes(searchName.trim()));
    setSearchResult(found.length > 0 ? found[0] : null);
  };

  const GRADE_COLORS: Record<string, string> = { A: '#22C55E', B: '#3D3A39', C: '#F59E0B', D: '#f87171' };
  const DIM = ['企微回复', '询价转化', '拉新', 'O2O效率', '无人时长', '巡店', '培训', '会议', '通报'];
  const DIM_KEYS = ['score_qw', 'score_xj', 'score_lx', 'score_o2o', 'score_wr', 'score_xd', 'score_px', 'score_hy', 'score_tb'] as const;
  const DIM_MAX = [10, 15, 10, 15, 10, 10, 10, 10, 10];

  const operatorSelf = useMemo(() => {
    if (!isOperator || visibleData.length === 0) return null;
    return visibleData[0];
  }, [isOperator, visibleData]);

  const operatorGlobalRank = useMemo(() => {
    if (!operatorSelf) return null;
    const sorted = [...rankingData].sort((a, b) => a.rank - b.rank);
    return sorted.find(p => p.name === operatorSelf.name)?.rank ?? null;
  }, [operatorSelf]);

  return (
    <div className="px-3 pt-3 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold" style={{ color: '#3D3A39' }}>
          {isOperator ? '我的排名' : '操盘手排名'}
        </h1>
        <span className="text-xs" style={{ color: '#8C8685' }}>
          {isAdmin ? '全部' : isManager ? managedRegions.join('/') : user?.name}
        </span>
      </div>

      {/* 操盘手个人卡片 */}
      {isOperator && operatorSelf && (
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'linear-gradient(135deg, #FFFDE7, #FFF)', border: '1px solid rgba(212,197,36,.25)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black" style={{ background: 'linear-gradient(135deg, #D4C524, #F9E72C)', color: '#fff' }}>
                {operatorSelf.grade}
              </div>
              <div>
                <div className="text-base font-bold" style={{ color: '#3D3A39' }}>{operatorSelf.name}</div>
                <div className="text-xs mt-0.5" style={{ color: '#8C8685' }}>{operatorSelf.city} · {operatorSelf.stores}家门店</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{ color: '#8C8685' }}>总排名 #{operatorGlobalRank ?? operatorSelf.rank}</div>
              <div className="text-3xl font-black" style={{ color: GRADE_COLORS[operatorSelf.grade] }}>{operatorSelf.total}<span className="text-xs font-normal ml-0.5" style={{ color: '#8C8685' }}>分</span></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DIM.map((d, j) => {
              const k = DIM_KEYS[j];
              const v = operatorSelf[k] || 0;
              const max = DIM_MAX[j];
              const pc = Math.min(100, Math.round(v / max * 100));
              const bc = GRADE_COLORS[operatorSelf.grade];
              return (
                <div key={d} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="text-[11px] mb-1" style={{ color: '#8C8685' }}>{d}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold" style={{ color: v === 0 ? '#f87171' : v >= max ? '#22C55E' : '#3D3A39' }}>{v}</span>
                    <span className="text-[10px]" style={{ color: '#B8B4B2' }}>/ {max}</span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pc}%`, background: v === 0 ? '#f87171' : bc }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search - 仅管理员和运营经理 */}
      {!isOperator && (
        <div className="rounded-2xl p-3 mb-3" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
          <div className="flex gap-2">
            <input
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="输入操盘手姓名查询"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ background: '#F9F9F9', border: '1px solid #E8E5E3', color: '#3D3A39' }}
            />
            <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#F9E72C', color: '#3D3A39' }}>查询</button>
          </div>
          {searchResult && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: '#F9F9F9' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold" style={{ color: GRADE_COLORS[searchResult.grade] }}>{searchResult.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-md font-bold" style={{ background: `${GRADE_COLORS[searchResult.grade]}22`, color: GRADE_COLORS[searchResult.grade] }}>{searchResult.grade}级</span>
              </div>
              <div className="text-xs mb-1" style={{ color: '#8C8685' }}>{searchResult.city} · {searchResult.stores}家门店 · 排名 #{searchResult.rank}</div>
              <div className="text-2xl font-black" style={{ color: GRADE_COLORS[searchResult.grade] }}>{searchResult.total}分</div>
            </div>
          )}
          {!searchResult && searchName.trim() && (
            <p className="mt-2 text-center text-xs" style={{ color: '#8C8685' }}>未找到匹配的操盘手</p>
          )}
        </div>
      )}

      {/* 排名列表 - 管理员和运营经理 */}
      {!isOperator && visibleData.length > 0 && (
        <div className="rounded-2xl p-3" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
          {/* Grade Tabs */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {(['ALL', 'A', 'B', 'C', 'D'] as GradeFilter[]).map(g => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: gradeFilter === g ? (GRADE_COLORS[g] || '#D4C524') : '#F5F5F5',
                  color: gradeFilter === g ? '#fff' : '#8C8685',
                }}
              >
                {g === 'ALL' ? '全部' : g} {gradeCounts[g]}
              </button>
            ))}
          </div>

          {/* Cards instead of table on mobile */}
          <div className="space-y-2">
            {filteredData.sort((a, b) => a.rank - b.rank).map(p => {
              const bc = GRADE_COLORS[p.grade] || '#3D3A39';
              return (
                <div key={p.rank} className="rounded-xl p-3" style={{ background: '#FAFAFA', border: '1px solid #F0EEEC' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: p.rank <= 3 ? bc + '22' : '#F0EEEC', color: p.rank <= 3 ? bc : '#8C8685' }}>{p.rank}</span>
                      <span className="text-sm font-bold" style={{ color: '#3D3A39' }}>{p.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold" style={{ background: `${bc}22`, color: bc }}>{p.grade}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black" style={{ color: bc }}>{p.total}</span>
                      <span className="text-[10px] ml-0.5" style={{ color: '#8C8685' }}>分</span>
                    </div>
                  </div>
                  <div className="text-xs mb-2" style={{ color: '#8C8685' }}>{p.city} · {p.stores}家</div>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                    {DIM.map((d, j) => {
                      const v = p[DIM_KEYS[j]] || 0;
                      const max = DIM_MAX[j];
                      return (
                        <div key={d} className="flex justify-between items-center">
                          <span className="text-[11px]" style={{ color: '#B8B4B2' }}>{d}</span>
                          <span className="text-[11px] font-semibold" style={{ color: v === 0 ? '#f87171' : v >= max ? '#22C55E' : '#3D3A39' }}>{v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isOperator && visibleData.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
          <p className="text-sm" style={{ color: '#8C8685' }}>暂无可见数据</p>
        </div>
      )}
    </div>
  );
}