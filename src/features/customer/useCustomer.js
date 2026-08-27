import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase.js";
import { useAuth } from "../../auth/useAuth.js";

export const customerKeys = {
  profile: (userId) => ["customer", "profile", userId],
  addresses: (userId) => ["customer", "addresses", userId],
};

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

// user_id is deliberately never included here: the table's column-level
// GRANT UPDATE for `authenticated` only covers the editable address fields
// (see supabase/migrations/20260824090000_customer_addresses.sql), not
// user_id, id, created_at or updated_at. Postgres checks column privileges
// against every column named in the SET clause -- even when the value is
// unchanged -- so putting user_id in an update body gets the whole request
// rejected with a permission-denied 403. It's added back in only for insert.
function cleanAddress(values) {
  return {
    label: values.label,
    address_line_1: values.address_line_1,
    address_line_2: values.address_line_2 || null,
    locality: values.locality || null,
    city: values.city || null,
    state: values.state || null,
    postal_code: values.postal_code || null,
    latitude: values.latitude,
    longitude: values.longitude,
    is_default: Boolean(values.is_default),
  };
}

export function useCustomerProfile() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: customerKeys.profile(user?.id),
    enabled: Boolean(isAuthenticated && user?.id),
    queryFn: async () => {
      const { data, error } = await requireClient()
        .from("profiles")
        .select("id, full_name, phone, avatar_url, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateCustomerProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fullName, phone }) => {
      const patch = {
        full_name: fullName || null,
        phone: phone || null,
      };
      const { data, error } = await requireClient()
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select("id, full_name, phone, avatar_url, created_at, updated_at")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.profile(user?.id) });
    },
  });
}

export function useCustomerAddresses() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: customerKeys.addresses(user?.id),
    enabled: Boolean(isAuthenticated && user?.id),
    queryFn: async () => {
      const { data, error } = await requireClient()
        .from("customer_addresses")
        .select("id, user_id, label, address_line_1, address_line_2, locality, city, state, postal_code, latitude, longitude, is_default, created_at, updated_at")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveCustomerAddress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }) => {
      const client = requireClient();
      const body = cleanAddress(values);

      if (body.is_default) {
        let clearQuery = client
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
        if (id) clearQuery = clearQuery.neq("id", id);
        const { error: clearError } = await clearQuery;
        if (clearError) throw clearError;
      }

      const query = id
        ? client.from("customer_addresses").update(body).eq("id", id)
        : client.from("customer_addresses").insert({ ...body, user_id: user.id });
      const { data, error } = await query
        .select("id, user_id, label, address_line_1, address_line_2, locality, city, state, postal_code, latitude, longitude, is_default, created_at, updated_at")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses(user?.id) });
    },
  });
}

export function useDeleteCustomerAddress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await requireClient().from("customer_addresses").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses(user?.id) });
    },
  });
}

export function useSetDefaultCustomerAddress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const client = requireClient();
      const { error: clearError } = await client
        .from("customer_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", id);
      if (clearError) throw clearError;

      const { data, error } = await client
        .from("customer_addresses")
        .update({ is_default: true })
        .eq("id", id)
        .select("id, user_id, label, address_line_1, address_line_2, locality, city, state, postal_code, latitude, longitude, is_default, created_at, updated_at")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses(user?.id) });
    },
  });
}
