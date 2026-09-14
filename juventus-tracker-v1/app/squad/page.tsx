import Link from 'next/link';
import { getUser, ratingClass } from '@/lib/data';
import { AutoRefresh } from '../components_client';

export default async function Squad() {
  const { supabase, user } = await getUser();
  if (!user) return null;

  const safe = async <T,>(query: any, fallback: T): Promise<T> => {
    try {
      const result = await query;
      if (result?.error) return fallback;
      return (result?.data ?? fallback) as T;
    } catch {
      return fallback;
    }
  };

  const players = await safe(
    supabase.from('players').select('*').eq('user_id', user.id).eq('active', true),
    [] as any[]
  );
  const coaches = await safe(
    supabase.from('coaches').select('*').eq('user_id', user.id).eq('active', true),
    [] as any[]
  );
  const ratings = await safe(
    supabase.from('match_players').select('player_id,user_rating').eq('user_id', user.id).not('user_rating', 'is', null),
    [] as any[]
  );
  const stats = await safe(
    supabase.from('player_match_stats').select('*').eq('user_id', user.id),
    [] as any[]
  );

  const ratingMap = new Map<string, number[]>();
  for (const row of ratings) {
    if (!row?.player_id) continue;
    const values = ratingMap.get(row.player_id) || [];
    const value = Number(row.user_rating);
    if (Number.isFinite(value)) values.push(value);
    ratingMap.set(row.player_id, values);
  }

  const totals = new Map<string, Record<string, number>>();
  const statKeys = [
    'appearances','minutes','goals','assists','shots','shots_on_target',
    'passes','successful_passes','successful_dribbles','duels_won','recoveries',
    'tackles','interceptions','fouls','yellow_cards','red_cards','saves','goals_conceded'
  ];
  for (const row of stats) {
    if (!row?.player_id) continue;
    const total = totals.get(row.player_id) || {};
    for (const key of statKeys) total[key] = (total[key] || 0) + Number(row[key] || 0);
    totals.set(row.player_id, total);
  }

  const roleOrder: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };
  const sortedPlayers = [...players].sort((a: any, b: any) =>
    (roleOrder[a?.role_group] ?? 9) - (roleOrder[b?.role_group] ?? 9) ||
    (Number(a?.number) || 999) - (Number(b?.number) || 999)
  );

  const groups: Array<[string, string]> = [
    ['GK', 'Portieri'],
    ['DF', 'Difensori'],
    ['MF', 'Centrocampisti'],
    ['FW', 'Attaccanti']
  ];

  const coachList = coaches.length ? coaches : [{ id: 'spalletti-fallback', name: 'Luciano Spalletti', external_id: '', photo_url: null }];

  return (
    <div>
      <AutoRefresh seconds={30} />
      <header className="topbar">
        <div>
          <p className="eyebrow">ROSA</p>
          <h1>Juventus</h1>
          <p className="muted">Allenatori e rosa, ordinati per ruolo.</p>
        </div>
      </header>

      <section className="role-section">
        <div className="role-title">Allenatori</div>
        <div className="player-grid coach-grid">
          {coachList.map((coach: any) => (
            <div className="player-card" key={coach.id}>
              <div className="player-top">
                {coach.photo_url || coach.external_id ? (
                  <img
                    className="player-photo"
                    src={coach.photo_url || `https://a.espncdn.com/i/headshots/soccer/players/full/${coach.external_id}.png`}
                    onError={(event: any) => { event.currentTarget.style.display = 'none'; }}
                    alt=""
                  />
                ) : null}
                <div>
                  <span className="position">ALLENATORE</span>
                  <h3>{coach.name}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {groups.map(([group, title]) => {
        const groupPlayers = sortedPlayers.filter((player: any) => player?.role_group === group);
        return (
          <section key={group} className="role-section">
            <div className="role-title">{title}</div>
            <div className="player-grid">
              {groupPlayers.map((player: any) => {
                const values = ratingMap.get(player.id) || [];
                const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
                const total = totals.get(player.id) || {};
                return (
                  <Link href={`/squad/${player.id}`} className="player-card" key={player.id}>
                    <div className="player-top">
                      <img
                        className="player-photo"
                        src={player.photo_url || `https://a.espncdn.com/i/headshots/soccer/players/full/${player.external_id}.png`}
                        onError={(event: any) => { event.currentTarget.style.display = 'none'; }}
                        alt=""
                      />
                      <div>
                        <span className="position">{player.position || title}</span>
                        <h3>{player.number != null ? `#${player.number} · ` : ''}{player.name}</h3>
                        {player.injury_status && <span className="injury">🩹 {player.injury_status}</span>}
                      </div>
                    </div>
                    <div className="player-stats">
                      {group === 'GK' ? <>
                        <div><span>Presenze</span><b>{total.appearances || 0}</b></div>
                        <div><span>Gol subiti</span><b>{total.goals_conceded || 0}</b></div>
                        <div><span>Parate</span><b>{total.saves || 0}</b></div>
                        <div><span>Minuti</span><b>{total.minutes || 0}</b></div>
                      </> : <>
                        <div><span>Presenze</span><b>{total.appearances || 0}</b></div>
                        <div><span>Gol</span><b>{total.goals || 0}</b></div>
                        <div><span>Assist</span><b>{total.assists || 0}</b></div>
                        <div><span>Minuti</span><b>{total.minutes || 0}</b></div>
                      </>}
                    </div>
                    <div className="rating-line">
                      <span>Tua media</span>
                      <strong className={average != null ? ratingClass(average) : ''}>{average != null ? average.toFixed(1) : '—'}</strong>
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
