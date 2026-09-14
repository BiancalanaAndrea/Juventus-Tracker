import Link from 'next/link';
import { getUser, ratingClass } from '@/lib/data';
import { AutoRefresh } from '../components_client';

const roleOrder: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };
const groups: Array<[string, string]> = [
  ['GK', 'Portieri'],
  ['DF', 'Difensori'],
  ['MF', 'Centrocampisti'],
  ['FW', 'Attaccanti'],
];

async function safeQuery<T>(query: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  try {
    const result = await query;
    if (result.error) return fallback;
    return result.data ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function Squad() {
  const { supabase, user } = await getUser();
  if (!user) return null;

  // Keep the page independent from the optional coaches table. This prevents
  // a missing/unmigrated coaches table from crashing the whole Rosa page.
  const players = await safeQuery(
    supabase
      .from('players')
      .select('id,external_id,name,number,position,photo_url,active,role_group,injury_status,injury_return_date')
      .eq('user_id', user.id)
      .eq('active', true),
    [] as any[]
  );

  const ratings = await safeQuery(
    supabase
      .from('match_players')
      .select('player_id,user_rating')
      .eq('user_id', user.id)
      .not('user_rating', 'is', null),
    [] as any[]
  );

  const stats = await safeQuery(
    supabase
      .from('player_match_stats')
      .select('player_id,appearances,minutes,goals,assists,shots,shots_on_target,shots_conceded,passes,successful_passes,successful_dribbles,duels_won,recoveries,tackles,interceptions,fouls,yellow_cards,red_cards,saves,goals_conceded')
      .eq('user_id', user.id),
    [] as any[]
  );

  const ratingMap = new Map<string, number[]>();
  for (const row of ratings) {
    if (!row.player_id || row.user_rating == null) continue;
    const list = ratingMap.get(row.player_id) ?? [];
    list.push(Number(row.user_rating));
    ratingMap.set(row.player_id, list);
  }

  const totals = new Map<string, Record<string, number>>();
  const statKeys = [
    'appearances','minutes','goals','assists','shots','shots_on_target','passes',
    'successful_passes','successful_dribbles','duels_won','recoveries','tackles',
    'interceptions','fouls','yellow_cards','red_cards','saves','goals_conceded'
  ];
  for (const row of stats) {
    if (!row.player_id) continue;
    const total = totals.get(row.player_id) ?? {};
    for (const key of statKeys) total[key] = (total[key] ?? 0) + Number(row[key] ?? 0);
    totals.set(row.player_id, total);
  }

  const sortedPlayers = [...players].sort(
    (a, b) => (roleOrder[a.role_group ?? ''] ?? 9) - (roleOrder[b.role_group ?? ''] ?? 9) ||
      Number(a.number ?? 999) - Number(b.number ?? 999)
  );

  return (
    <div>
      <AutoRefresh seconds={30} />
      <header className="topbar">
        <div>
          <p className="eyebrow">ROSA</p>
          <h1>Juventus</h1>
          <p className="muted">Allenatore e rosa, ordinati per ruolo.</p>
        </div>
      </header>

      <section className="role-section">
        <div className="role-title">Allenatori</div>
        <div className="player-grid coach-grid">
          <div className="player-card">
            <div className="player-top">
              <div className="player-photo coach-placeholder">LS</div>
              <div>
                <span className="position">ALLENATORE</span>
                <h3>Luciano Spalletti</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {groups.map(([group, title]) => {
        const groupPlayers = sortedPlayers.filter((p) => p.role_group === group);
        return (
          <section key={group} className="role-section">
            <div className="role-title">{title}</div>
            <div className="player-grid">
              {groupPlayers.length === 0 ? (
                <div className="empty">Nessun giocatore disponibile.</div>
              ) : groupPlayers.map((p) => {
                const ratingsForPlayer = ratingMap.get(p.id) ?? [];
                const average = ratingsForPlayer.length
                  ? ratingsForPlayer.reduce((sum, value) => sum + value, 0) / ratingsForPlayer.length
                  : null;
                const total = totals.get(p.id) ?? {};
                const photo = p.photo_url || `https://media.api-sports.io/football/players/${p.external_id}.png`;

                return (
                  <Link href={`/squad/${p.id}`} className="player-card" key={p.id}>
                    <div className="player-top">
                      <img
                        className="player-photo"
                        src={photo}
                        alt={p.name}
                      />
                      <div>
                        <span className="position">{p.position || title}</span>
                        <h3>{p.number != null ? `#${p.number} · ` : ''}{p.name}</h3>
                        {p.injury_status && <span className="injury">🩹 {p.injury_status}</span>}
                      </div>
                    </div>
                    <div className="player-stats">
                      {group === 'GK' ? <>
                        <div><span>Presenze</span><b>{total.appearances ?? 0}</b></div>
                        <div><span>Gol subiti</span><b>{total.goals_conceded ?? 0}</b></div>
                        <div><span>Parate</span><b>{total.saves ?? 0}</b></div>
                        <div><span>Minuti</span><b>{total.minutes ?? 0}</b></div>
                      </> : <>
                        <div><span>Presenze</span><b>{total.appearances ?? 0}</b></div>
                        <div><span>Gol</span><b>{total.goals ?? 0}</b></div>
                        <div><span>Assist</span><b>{total.assists ?? 0}</b></div>
                        <div><span>Minuti</span><b>{total.minutes ?? 0}</b></div>
                      </>}
                    </div>
                    <div className="rating-line">
                      <span>Tua media</span>
                      <strong className={average != null ? ratingClass(average) : ''}>
                        {average != null ? average.toFixed(1) : '—'}
                      </strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
