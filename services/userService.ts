import { logger } from "../utils/logger";
import { Profile, supabase } from "./supabaseClient";

export class UserService {
  // Auth methods
  static async signIn(email: string, password: string) {
    logger.log("UserService.signIn called with:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      logger.log("Supabase auth result:", { data, error });
      return { data, error };
    } catch (error) {
      logger.error("Supabase auth exception:", error);
      throw error;
    }
  }

  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // Profile will be created after sign-in when user is authenticated
    return { data, error };
  }

  static async signOut() {
    try {
      // Capture current user id while session is valid
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Set presence offline BEFORE signing out (RLS requires auth context)
        try {
          logger.log("UserService: Setting user offline before signout");

          // Get active profile
          const { data: activeProfile } = await UserService.getActiveProfile();

          if (activeProfile) {
            // Try multiple approaches to update presence
            let presenceUpdated = false;

            // Approach 1: Try upsert
            try {
              const { error } = await supabase.from("user_presence").upsert(
                {
                  user_id: activeProfile.id,
                  online: false,
                  last_seen: new Date().toISOString(),
                },
                {
                  onConflict: "user_id",
                }
              );

              if (!error) {
                logger.log("UserService: Presence updated via upsert");
                presenceUpdated = true;
              } else {
                logger.error("UserService: Upsert failed:", error);
              }
            } catch (upsertError) {
              logger.error("UserService: Upsert exception:", upsertError);
            }

            // Approach 2: Try direct update if upsert failed
            if (!presenceUpdated) {
              try {
                const { error } = await supabase
                  .from("user_presence")
                  .update({
                    online: false,
                    last_seen: new Date().toISOString(),
                  })
                  .eq("user_id", activeProfile.id);

                if (!error) {
                  logger.log("UserService: Presence updated via direct update");
                  presenceUpdated = true;
                } else {
                  logger.error("UserService: Direct update failed:", error);
                }
              } catch (updateError) {
                logger.error(
                  "UserService: Direct update exception:",
                  updateError
                );
              }
            }

            // Approach 3: Try insert if both failed (profile might not have presence record)
            if (!presenceUpdated) {
              try {
                const { error } = await supabase.from("user_presence").insert({
                  user_id: activeProfile.id,
                  online: false,
                  last_seen: new Date().toISOString(),
                });

                if (!error) {
                  logger.log("UserService: Presence created via insert");
                } else {
                  logger.error("UserService: Insert failed:", error);
                }
              } catch (insertError) {
                logger.error("UserService: Insert exception:", insertError);
              }
            }

            if (!presenceUpdated) {
              logger.log(
                "UserService: All presence update attempts failed, continuing with signout"
              );
            }
          } else {
            logger.log(
              "UserService: No active profile found, skipping presence update"
            );
          }
        } catch (presenceError) {
          logger.error(
            "UserService: Exception setting presence offline:",
            presenceError
          );
          // Don't block signout if presence update fails
        }
      }

      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error } as any;
    }
  }

  static async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  }

  // Profile methods
  static async createProfile(
    profileData: Omit<Profile, "id" | "created_at" | "updated_at">
  ) {
    const { data, error } = await supabase
      .from("profiles")
      .insert([profileData])
      .select()
      .single();

    return { data, error };
  }

  /**
   * Get the active profile for the current auth user
   * Works for both individual and family accounts
   *
   * Logic:
   * 1. Query: user_id = auth.uid() AND is_active = true
   * 2. Returns the active profile
   * 3. If account_type = "individual" → Individual account
   * 4. If account_type = "family" → Family account (this is one of the family member profiles)
   */
  static async getProfile(userId: string) {
    try {
      logger.log("UserService.getProfile: Loading profile for user:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(); // Use maybeSingle() to handle cases where no profile exists yet

      logger.log(
        "UserService.getProfile: Result:",
        data
          ? {
              user_id: data.user_id,
              full_name: data.full_name,
              account_type: data.account_type,
              is_active: data.is_active,
            }
          : "null"
      );

      return { data, error };
    } catch (error) {
      // Handle auth session missing errors gracefully
      if (
        error instanceof Error &&
        error.message.includes("Auth session missing")
      ) {
        return { data: null, error: null };
      }
      throw error;
    }
  }

  static async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    return { data, error };
  }

  static async getAllProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error };
  }

  // Likes methods
  static async getLikedProfiles(profileId: string) {
    logger.log(
      "UserService: getLikedProfiles called with profileId:",
      profileId
    );

    // Fetch liked profile ids from `likes` (liker_id -> liked_id)
    const { data: likes, error: likesError } = await supabase
      .from("likes")
      .select("liked_id, created_at")
      .eq("liker_id", profileId)
      .order("created_at", { ascending: false });

    logger.log("UserService: Likes data:", likes);

    if (likesError || !likes || likes.length === 0) {
      return {
        data: [] as { profile: Profile; likedAt: string }[],
        error: likesError || null,
      };
    }

    const likedProfileIds = likes.map((l: any) => l.liked_id as string);
    logger.log("UserService: Liked profile IDs:", likedProfileIds);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", likedProfileIds);

    logger.log("UserService: Profiles data:", profiles);

    if (profilesError || !profiles) {
      return {
        data: [] as { profile: Profile; likedAt: string }[],
        error: profilesError || null,
      };
    }

    const likedAtByProfileId: Record<string, string> = Object.fromEntries(
      likes.map((l: any) => [l.liked_id as string, l.created_at as string])
    );

    logger.log("UserService: likedAtByProfileId map:", likedAtByProfileId);

    const merged = profiles
      .map((p: any) => {
        const likedAt = likedAtByProfileId[p.id];
        logger.log(
          `UserService: Profile ${p.id} (${p.full_name}) - likedAt:`,
          likedAt
        );
        return {
          profile: p as Profile,
          likedAt: likedAt || new Date().toISOString(), // Fallback to current date if undefined
        };
      })
      .sort(
        (a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime()
      );

    logger.log("UserService: Merged result count:", merged.length);
    return { data: merged, error: null };
  }

  static async getLikedUserIds(profileId: string) {
    logger.log(
      "UserService: getLikedUserIds called with profileId:",
      profileId
    );
    try {
      const { data, error } = await supabase
        .from("likes")
        .select("liked_id")
        .eq("liker_id", profileId);

      logger.log("UserService: getLikedUserIds result:", { data, error });
      const ids = (data || []).map((r: any) => r.liked_id as string);
      return { data: ids, error };
    } catch (err) {
      logger.error("UserService: getLikedUserIds exception:", err);
      return { data: [], error: err };
    }
  }

  static async getDislikedUserIds(profileId: string) {
    logger.log(
      "UserService: getDislikedUserIds called with profileId:",
      profileId
    );
    try {
      const { data, error } = await supabase
        .from("dislikes")
        .select("disliked_user_id")
        .eq("user_id", profileId);

      logger.log("UserService: getDislikedUserIds result:", { data, error });
      const ids = (data || []).map((r: any) => r.disliked_user_id as string);
      return { data: ids, error };
    } catch (err) {
      logger.error("UserService: getDislikedUserIds exception:", err);
      return { data: [], error: err };
    }
  }

  static async likeUser(profileId: string, likedProfileId: string) {
    logger.log("UserService: Attempting to like profile:", {
      profileId,
      likedProfileId,
    });

    try {
      const { data, error } = await supabase
        .from("likes")
        .insert([
          {
            liker_id: profileId,
            liked_id: likedProfileId,
          },
        ])
        .select();

      logger.log("UserService: Like result:", { data, error });
      return { error };
    } catch (err) {
      logger.error("UserService: Exception in likeUser:", err);
      return { error: err };
    }
  }

  static async dislikeUser(profileId: string, dislikedProfileId: string) {
    logger.log("UserService: Attempting to dislike profile:", {
      profileId,
      dislikedProfileId,
    });

    try {
      const { data, error } = await supabase
        .from("dislikes")
        .insert([
          {
            user_id: profileId,
            disliked_user_id: dislikedProfileId,
          },
        ])
        .select();

      logger.log("UserService: Dislike result:", { data, error });
      return { error };
    } catch (err) {
      logger.error("UserService: Exception in dislikeUser:", err);
      return { error: err };
    }
  }

  static async removeLike(profileId: string, likedProfileId: string) {
    logger.log("UserService: Attempting to remove like:", {
      profileId,
      likedProfileId,
    });

    try {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("liker_id", profileId)
        .eq("liked_id", likedProfileId);

      logger.log("UserService: Remove like result:", { error });
      return { error };
    } catch (err) {
      logger.error("UserService: Exception in removeLike:", err);
      return { error: err };
    }
  }

  // Storage methods
  static async uploadAvatar(file: File, userId: string) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
      });

    if (error) {
      return { data: null, error };
    }

    const { data: publicData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return { data: publicData.publicUrl, error: null };
  }

  static async deleteAvatar(fileName: string) {
    const { error } = await supabase.storage.from("avatars").remove([fileName]);

    return { error };
  }

  // ============================================================================
  // FAMILY ACCOUNT METHODS (Multiple Profiles Architecture)
  // ============================================================================

  /**
   * Get all profiles for the current auth user
   * For family accounts, this returns all family member profiles
   * For individual accounts, this returns just the user's own profile
   */
  static async getManagedProfiles() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get the currently active profile for the auth user
   * Works for both individual and family accounts
   * Simply calls getProfile() which queries: user_id = auth.uid() AND is_active = true
   */
  static async getActiveProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Return gracefully when no user (e.g., during signout)
        return { data: null, error: null };
      }

      logger.log("UserService.getActiveProfile: Loading for user:", user.id);

      // Use the unified getProfile() function
      const { data, error } = await UserService.getProfile(user.id);

      logger.log(
        "UserService.getActiveProfile: Result:",
        data
          ? {
              user_id: data.user_id,
              full_name: data.full_name,
              account_type: data.account_type,
              is_active: data.is_active,
            }
          : "null"
      );

      return { data, error };
    } catch (error) {
      logger.error("UserService.getActiveProfile: Exception:", error);
      return { data: null, error };
    }
  }

  /**
   * Activate a specific profile
   * Deactivates all other profiles for this user and activates the selected one
   */
  static async activateProfile(profileId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      logger.log("UserService.activateProfile: Activating profile:", profileId);

      // First deactivate all profiles for this user
      await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Then activate the selected profile
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("id", profileId)
        .eq("user_id", user.id)
        .select()
        .single();

      logger.log(
        "UserService.activateProfile: Result:",
        data
          ? {
              id: data.id,
              full_name: data.full_name,
              is_active: data.is_active,
            }
          : "null"
      );

      return { data, error };
    } catch (error) {
      logger.error("UserService.activateProfile: Exception:", error);
      return { data: null, error };
    }
  }

  /**
   * Create a new profile for a family account
   * All profiles for a family account have the same user_id (auth user ID)
   * Differentiated by profile id and is_active flag
   */
  static async createFamilyProfile(
    profileData: Omit<
      Profile,
      | "id"
      | "created_at"
      | "updated_at"
      | "user_id"
      | "is_active"
      | "account_type"
    >
  ) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      logger.log(
        "UserService.createFamilyProfile: Creating profile for user:",
        user.id
      );

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id, // Same user_id as all other profiles for this user
          is_active: false, // New profiles start inactive
          account_type: "family", // Family member profiles
          ...profileData,
        })
        .select()
        .single();

      logger.log(
        "UserService.createFamilyProfile: Result:",
        data
          ? {
              id: data.id,
              user_id: data.user_id,
              full_name: data.full_name,
              account_type: data.account_type,
              is_active: data.is_active,
            }
          : "null"
      );

      return { data, error };
    } catch (error) {
      logger.error("UserService.createFamilyProfile: Exception:", error);
      return { data: null, error };
    }
  }

  /**
   * Update a family member profile
   */
  static async updateFamilyProfile(
    profileId: string,
    updates: Partial<Profile>
  ) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profileId)
        .eq("user_id", user.id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete a family member profile
   * Must have at least one profile remaining
   */
  static async deleteFamilyProfile(profileId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check how many profiles this user has
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id);

      if (!allProfiles || allProfiles.length <= 1) {
        throw new Error("Cannot delete the only profile");
      }

      const { data, error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId)
        .eq("user_id", user.id);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
}
