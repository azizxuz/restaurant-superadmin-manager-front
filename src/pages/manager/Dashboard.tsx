import { useState, useMemo } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { generateRevenueData, formatPrice } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { Loader2 } from 'lucide-react';

const RANGES = [
    { label: '1 hafta', days: 7 },
    { label: '1 oy', days: 30 },
    { label: '3 oy', days: 90 },
    { label: '6 oy', days: 180 },
    { label: '1 yil', days: 365 },
];

export default function ManagerDashboard() {
    const { language } = useSettings();
    const [rangeDays, setRangeDays] = useState(30);

    const { data: status, isLoading } = useQuery({
        queryKey: ['dashboard-status'],
        queryFn: async () => {
            const res = await dashboardService.getStatus();
            return res.data;
        },
    });

    const chartData = useMemo(() => generateRevenueData(rangeDays), [rangeDays]);
    const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
    const totalExpense = chartData.reduce((s, d) => s + d.expense, 0);
    const totalProfit = totalRevenue - totalExpense;

    return (
        <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">{t('Bosh sahifa', language)}</h2>

            {/* Stats Cards */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8 mb-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    <StatsCard title={t('Jami xodimlar', language)} value={status?.totalUsers ?? 0} />
                    <StatsCard title={t('Filiallar', language)} value={status?.totalBranches ?? 0} />
                    <StatsCard title={t('Menejerlar', language)} value={status?.totalManagers ?? 0} />
                    <StatsCard
                        title={t("O'rtacha kunlik daromad", language)}
                        value={formatPrice(status?.averageDailyRevenue ?? 0)}
                    />
                </div>
            )}

            {/* Revenue Chart */}
            <Card className="p-4 sm:p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t("Moliyaviy ko'rsatkichlar", language)}</h3>
                        <div className="flex flex-wrap gap-3 sm:gap-4 mt-1">
                            <span className="text-xs sm:text-sm text-muted-foreground">{t('Daromad', language)}: <span className="font-medium text-foreground">{formatPrice(totalRevenue)}</span></span>
                            <span className="text-xs sm:text-sm text-muted-foreground">{t('Xarajat', language)}: <span className="font-medium text-foreground">{formatPrice(totalExpense)}</span></span>
                            <span className="text-xs sm:text-sm text-muted-foreground">{t('Foyda', language)}: <span className="font-medium text-foreground">{formatPrice(totalProfit)}</span></span>
                        </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        {RANGES.map(r => (
                            <Button
                                key={r.days}
                                variant={rangeDays === r.days ? 'default' : 'ghost'}
                                size="sm"
                                className="text-xs h-7 px-2.5"
                                onClick={() => setRangeDays(r.days)}
                            >
                                {t(r.label, language)}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="h-[260px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={2} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 12%, 90%)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: 'hsl(222, 10%, 46%)' }}
                                tickLine={false}
                                axisLine={false}
                                interval={Math.max(0, Math.floor(chartData.length / 8))}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'hsl(222, 10%, 46%)' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={v => `${(v / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip
                                formatter={(value: number) => formatPrice(value)}
                                contentStyle={{
                                    background: 'hsl(0, 0%, 100%)',
                                    border: '1px solid hsl(222, 12%, 90%)',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                }}
                            />
                            <Legend
                                formatter={(value: string) => (
                                    <span style={{ color: 'hsl(222, 25%, 12%)', fontSize: '13px' }}>{value}</span>
                                )}
                            />
                            <Bar dataKey="revenue" fill="hsl(32, 95%, 52%)" name={t('Daromad', language)} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" fill="hsl(222, 30%, 16%)" name={t('Xarajat', language)} radius={[4, 4, 0, 0]} opacity={0.7} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Recent Orders - hozircha mock data */}
            <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">{t('Oxirgi buyurtmalar', language)}</h3>
                <div className="text-sm text-muted-foreground text-center py-6">
                    {t('Tez kunda...', language)}
                </div>
            </Card>
        </div>
    );
}
