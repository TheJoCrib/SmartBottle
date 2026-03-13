import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { formatMl } from "../../utils/formatting";

export default function Social() {
  const { token } = useAuthStore();
  const { minimalSocialMode } = useSettingsStore();

  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [challengeName, setChallengeName] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeGoal, setChallengeGoal] = useState("10000");
  const [challengeDays, setChallengeDays] = useState("7");

  const friends = useQuery(api.social.getFriends, token ? { token } : "skip");
  const pendingRequests = useQuery(api.social.getPendingRequests, token ? { token } : "skip");
  const leaderboard = useQuery(api.social.getLeaderboard, token ? { token } : "skip");
  const challenges = useQuery(api.social.getChallenges, token ? { token } : "skip");

  const sendFriendRequest = useMutation(api.social.sendFriendRequest);
  const acceptRequest = useMutation(api.social.acceptFriendRequest);
  const rejectRequest = useMutation(api.social.rejectFriendRequest);
  const createChallenge = useMutation(api.social.createChallenge);

  if (minimalSocialMode) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="eye-off-outline" size={64} color="#94A3B8" />
          <Text className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mt-4 text-center">
            Minimal Mode Active
          </Text>
          <Text className="text-text-light-secondary dark:text-text-dark-secondary mt-2 text-center">
            Social features are hidden. You can enable them in Settings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendFriendRequest = async () => {
    if (!friendEmail.trim() || !token) return;
    try {
      await sendFriendRequest({ token, friendEmail: friendEmail.trim() });
      setFriendEmail("");
      setShowAddFriend(false);
      Alert.alert("Success", "Friend request sent!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send request");
    }
  };

  const handleAcceptRequest = async (requestId: any) => {
    if (!token) return;
    try {
      await acceptRequest({ token, requestId });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleRejectRequest = async (requestId: any) => {
    if (!token) return;
    try {
      await rejectRequest({ token, requestId });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleCreateChallenge = async () => {
    if (!challengeName.trim() || !token) return;
    try {
      await createChallenge({
        token,
        name: challengeName.trim(),
        description: challengeDesc.trim(),
        goalMl: parseInt(challengeGoal) || 10000,
        durationDays: parseInt(challengeDays) || 7,
      });
      setChallengeGoal("10000");
      setChallengeDays("7");
      setChallengeName("");
      setChallengeDesc("");
      setShowCreateChallenge(false);
      Alert.alert("Success", "Challenge created!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create challenge");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Social
          </Text>
        </View>

        
        {pendingRequests && pendingRequests.length > 0 && (
          <View className="px-6 py-4">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              Friend Requests
            </Text>
            {pendingRequests.map((request) => (
              <View
                key={request.id}
                className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-2 flex-row items-center"
              >
                <View className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center mr-3">
                  <Text className="text-lg">{request.avatar || "👤"}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {request.name}
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-success-500 px-3 py-1.5 rounded-lg mr-2"
                  onPress={() => handleAcceptRequest(request.id)}
                >
                  <Text className="text-white text-xs font-medium">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-lg"
                  onPress={() => handleRejectRequest(request.id)}
                >
                  <Text className="text-text-light-secondary dark:text-text-dark-secondary text-xs font-medium">
                    Decline
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Friends
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setShowAddFriend(true)}
            >
              <Ionicons name="person-add-outline" size={20} color="#0EA5E9" />
              <Text className="text-primary-500 ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {friends && friends.length > 0 ? (
            <View>
              {friends.map((friend) => (
                <View
                  key={friend!.id}
                  className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-2 flex-row items-center"
                >
                  <View className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center mr-3">
                    <Text className="text-lg">{friend!.avatar || "👤"}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {friend!.name}
                    </Text>
                    <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      Lv.{friend!.level} • {friend!.currentStreak} day streak
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 items-center">
              <Ionicons name="people-outline" size={48} color="#94A3B8" />
              <Text className="text-text-light-secondary dark:text-text-dark-secondary mt-3 text-center">
                Add friends to see their progress{"\n"}and compete together!
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary-500 px-6 py-3 rounded-xl"
                onPress={() => setShowAddFriend(true)}
              >
                <Text className="text-white font-semibold">Find Friends</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        
        <View className="px-6 py-4">
          <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Leaderboard
          </Text>

          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
            <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <Text className="w-8 text-xs text-text-light-muted dark:text-text-dark-muted">
                #
              </Text>
              <Text className="flex-1 text-xs text-text-light-muted dark:text-text-dark-muted">
                User
              </Text>
              <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                This Week
              </Text>
            </View>

            {leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => {
                const rank = index + 1;
                const medal =
                  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`;
                return (
                  <View
                    key={entry!.id}
                    className={`flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${
                      entry!.isCurrentUser ? "bg-primary-50 dark:bg-primary-900/20" : ""
                    }`}
                  >
                    <Text className="w-8 font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {medal}
                    </Text>
                    <View className="flex-1 flex-row items-center">
                      <View className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full mr-2 items-center justify-center">
                        <Text className="text-sm">{entry!.avatar || "👤"}</Text>
                      </View>
                      <View>
                        <Text
                          className={`text-sm ${
                            entry!.isCurrentUser
                              ? "font-bold text-primary-500"
                              : "text-text-light-primary dark:text-text-dark-primary"
                          }`}
                        >
                          {entry!.name} {entry!.isCurrentUser ? "(You)" : ""}
                        </Text>
                        <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                          Lv.{entry!.level}
                        </Text>
                      </View>
                    </View>
                    <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {(entry!.weeklyTotal / 1000).toFixed(1)}L
                    </Text>
                  </View>
                );
              })
            ) : (
              <View className="p-6 items-center">
                <Text className="text-text-light-muted dark:text-text-dark-muted text-sm">
                  Add friends to see the leaderboard
                </Text>
              </View>
            )}
          </View>
        </View>

        
        <View className="px-6 py-4 pb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Challenges
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setShowCreateChallenge(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#0EA5E9" />
              <Text className="text-primary-500 ml-1">Create</Text>
            </TouchableOpacity>
          </View>

          {challenges && challenges.length > 0 ? (
            challenges.map((challenge) => (
              <View
                key={challenge.id}
                className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-3"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {challenge.name}
                  </Text>
                  <View
                    className={`px-2 py-1 rounded-full ${
                      challenge.isActive
                        ? "bg-success-100 dark:bg-success-900"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-medium ${
                        challenge.isActive
                          ? "text-success-600 dark:text-success-400"
                          : "text-text-light-muted dark:text-text-dark-muted"
                      }`}
                    >
                      {challenge.isActive
                        ? `${challenge.daysRemaining}d left`
                        : "Ended"}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  {challenge.description}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                    Goal: {formatMl(challenge.goalMl)}
                  </Text>
                  <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                    {challenge.participantCount} participants
                  </Text>
                </View>
                
                <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                  <View
                    className="h-full bg-primary-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((challenge.progress.reduce((s, p) => s + p.totalMl, 0) /
                          challenge.participantCount /
                          challenge.goalMl) *
                          100)
                      )}%`,
                    }}
                  />
                </View>
              </View>
            ))
          ) : (
            <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 items-center">
              <Ionicons name="trophy-outline" size={48} color="#94A3B8" />
              <Text className="text-text-light-secondary dark:text-text-dark-secondary mt-3 text-center">
                No active challenges{"\n"}Create one or join a friend's challenge!
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary-500 px-6 py-3 rounded-xl"
                onPress={() => setShowCreateChallenge(true)}
              >
                <Text className="text-white font-semibold">Create Challenge</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      
      <Modal visible={showAddFriend} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background-light dark:bg-background-dark rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Add Friend
              </Text>
              <TouchableOpacity onPress={() => setShowAddFriend(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
              Enter your friend's email address
            </Text>
            <TextInput
              className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary mb-4"
              placeholder="friend@email.com"
              placeholderTextColor="#94A3B8"
              value={friendEmail}
              onChangeText={setFriendEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              className={`bg-primary-500 rounded-xl py-4 items-center ${
                !friendEmail.trim() ? "opacity-50" : ""
              }`}
              onPress={handleSendFriendRequest}
              disabled={!friendEmail.trim()}
            >
              <Text className="text-white font-semibold text-lg">Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal visible={showCreateChallenge} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background-light dark:bg-background-dark rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Create Challenge
              </Text>
              <TouchableOpacity onPress={() => setShowCreateChallenge(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <TextInput
              className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-text-light-primary dark:text-text-dark-primary mb-3"
              placeholder="Challenge name"
              placeholderTextColor="#94A3B8"
              value={challengeName}
              onChangeText={setChallengeName}
            />
            <TextInput
              className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-text-light-primary dark:text-text-dark-primary mb-3"
              placeholder="Description (optional)"
              placeholderTextColor="#94A3B8"
              value={challengeDesc}
              onChangeText={setChallengeDesc}
            />
            <View className="flex-row space-x-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mb-1">
                  Goal (ml)
                </Text>
                <TextInput
                  className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-text-light-primary dark:text-text-dark-primary text-center"
                  value={challengeGoal}
                  onChangeText={setChallengeGoal}
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mb-1">
                  Duration (days)
                </Text>
                <TextInput
                  className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-text-light-primary dark:text-text-dark-primary text-center"
                  value={challengeDays}
                  onChangeText={setChallengeDays}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <TouchableOpacity
              className={`bg-primary-500 rounded-xl py-4 items-center ${
                !challengeName.trim() ? "opacity-50" : ""
              }`}
              onPress={handleCreateChallenge}
              disabled={!challengeName.trim()}
            >
              <Text className="text-white font-semibold text-lg">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
