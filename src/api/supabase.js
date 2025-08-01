import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Delete player by id (and remove from player_group)
export const deletePlayer = async (playerId) => {
  // Remove associations first
  await supabase.from('player_group').delete().eq('player', playerId);
  // Remove player
  const { error } = await supabase.from('players').delete().eq('id', playerId);
  if (error) {
    console.error('Failed to delete player:', error);
    throw error;
  }
};

// Delete group by id (and remove from player_group)
export const deleteGroup = async (groupId) => {
  // Remove player-group associations for this group
  await supabase.from('player_group').delete().eq('group', groupId);
  // Remove group
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) {
    console.error('Failed to delete group:', error);
    throw error;
  }
};


export const storePlayer = async (player) => {
    const body = player.id ? {
        id: player.id,
        name: player.name,
        stats: player.stats,
        stats_per_game: player.perGame
    } : {
        name: player.name,
        stats: player.stats,
        stats_per_game: player.perGame
    }
    const {data, error} = await supabase.from('players').upsert(body).select();
    if (error) {
        console.error(error)
        return;
    }
    const newPlayer=  data[0];
    const playerGroups = player.groups.map(group => {
        return {player: newPlayer.id, group: group}
    })
    await supabase.from('player_group').insert(playerGroups);
    newPlayer.groups = player.groups
    return newPlayer;
}

export const updatePlayerGroups = async (playerId, groups) => {
    // Delete existing associations
    await supabase.from('player_group').delete().eq('player', playerId);
    // Create new associations
    const playerGroups = groups.map(group => {
        return {player: playerId, group: group}
    })
    await supabase.from('player_group').insert(playerGroups);
}


export const storeGroups = async (groupName) => {
    // name; 
    const {data, error} =  await supabase.from('groups').insert({name:groupName}).select();
    if (error) {
        console.error(error)
    }
    return data[0] 
}

export const createGame = async(opponentTeam) => {
    const {data, error} = await supabase.from('games').insert({
        opponent: opponentTeam,
        points: JSON.stringify([]),
        stats: JSON.stringify({}),
        our_score: 0,
        opponent_score: 0,
        start_time: new Date(),
        end_time: null
    }).select();
    if (error) {
        console.error(error);
        return;
    }
    return data[0];
}

export const storeGame = async (gameId, our_score, opponent_score, points, end_time ) => {
    const {data, error} = await supabase.from('games').upsert({
        id: gameId,
        our_score: our_score,
        opponent_score: opponent_score,
        points: JSON.stringify(points),
        end_time: end_time
    }).select();
    return data[0];
}

export const unassignPlayerFromGroup = async (playerId, groupId) => {
    const { error } = await supabase
        .from('player_group')
        .delete()
        .eq('player', playerId)
        .eq('group', groupId);
    if (error) {
        console.error('Failed to unassign player from group:', error);
        throw error;
    }
};

export const loadInitialData = async () => {
    try {
      const { data: playersData } = await supabase.from('players').select();
      const { data: groupsData } = await supabase.from('groups').select();
      const { data: gamesData } = await supabase.from('games').select();
      const {data: playerGroupsData} = await supabase.from('player_group').select();
      playersData.forEach(player => {
        player.groups = [];
      })
      playerGroupsData.forEach(playerGroup => {
    const player = playersData.find(player => player.id === playerGroup.player);
    if (player) {
        player.groups.push(playerGroup.group);
    }
}   )    
console.log(playersData)


    return {playersData, groupsData, gamesData}
    } catch (err) {
      console.error("Error loading initial data from Supabase", err);
    }
  };
