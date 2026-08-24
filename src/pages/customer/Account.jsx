import { Link, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Check, Home, LocateFixed, MapPin, Pencil, Star, Trash2 } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Field, { TextInput } from "../../components/common/Field.jsx";
import MapPicker from "../../components/location/MapPicker.jsx";
import { useAuth } from "../../auth/useAuth.js";
import { friendlyAuthMessage } from "../../auth/authMessages.js";
import { addressSchema, profileSchema } from "../../features/customer/schemas.js";
import {
  useCustomerAddresses,
  useCustomerProfile,
  useDeleteCustomerAddress,
  useSaveCustomerAddress,
  useSetDefaultCustomerAddress,
  useUpdateCustomerProfile,
} from "../../features/customer/useCustomer.js";
import { zodResolver } from "../../lib/zodResolver.js";
import { useLocationStore } from "../../store/locationStore.js";

const EMPTY_ADDRESS = {
  label: "Home",
  address_line_1: "",
  address_line_2: "",
  locality: "",
  city: "",
  state: "",
  postal_code: "",
  latitude: "",
  longitude: "",
  is_default: false,
};

function addressSummary(address) {
  return [
    address.address_line_1,
    address.address_line_2,
    address.locality,
    address.city,
    address.state,
    address.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
}

function toActiveLocation(address) {
  return {
    lat: Number(address.latitude),
    lng: Number(address.longitude),
    accuracy: null,
    source: "saved",
    addressId: address.id,
    addressLabel: address.label,
    addressLine: addressSummary(address),
  };
}

function ProfileSection() {
  const { user } = useAuth();
  const profile = useCustomerProfile();
  const updateProfile = useUpdateCustomerProfile();
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "" },
  });

  useEffect(() => {
    if (!profile.data) return;
    reset({
      fullName: profile.data.full_name ?? "",
      phone: profile.data.phone ?? "",
    });
  }, [profile.data, reset]);

  const onSubmit = async (values) => {
    setMessage("");
    setFormError("");
    try {
      await updateProfile.mutateAsync(values);
      setMessage("Profile updated.");
    } catch (error) {
      setFormError(friendlyAuthMessage(error));
    }
  };

  return (
    <section className="rounded-panel border border-line bg-surface p-5 sm:p-6" aria-labelledby="profile-heading">
      <div>
        <h2 id="profile-heading" className="text-section text-ink">
          Profile
        </h2>
        <p className="mt-1 text-meta text-ink-muted">
          Your role and internal account settings are managed securely by Kirana Connect.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 grid gap-5 sm:grid-cols-2">
        {message ? <Alert tone="success" className="sm:col-span-2">{message}</Alert> : null}
        {formError ? <Alert tone="error" className="sm:col-span-2">{formError}</Alert> : null}

        <Field label="Full name" error={errors.fullName?.message}>
          {(field) => (
            <TextInput {...field} {...register("fullName")} invalid={Boolean(errors.fullName)} autoComplete="name" />
          )}
        </Field>

        <Field label="Phone" error={errors.phone?.message}>
          {(field) => (
            <TextInput
              {...field}
              {...register("phone")}
              invalid={Boolean(errors.phone)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
          )}
        </Field>

        <Field label="Email">
          {(field) => (
            <TextInput {...field} value={user?.email ?? ""} readOnly className="bg-surface-sunken text-ink-muted" />
          )}
        </Field>

        <div className="flex items-end justify-end">
          <Button type="submit" disabled={isSubmitting || updateProfile.isPending}>
            {isSubmitting || updateProfile.isPending ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function AddressForm({ editing, currentLocation, onCancel, onDone }) {
  const saveAddress = useSaveCustomerAddress();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY_ADDRESS,
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");

  useEffect(() => {
    reset(
      editing
        ? {
            label: editing.label ?? "Home",
            address_line_1: editing.address_line_1 ?? "",
            address_line_2: editing.address_line_2 ?? "",
            locality: editing.locality ?? "",
            city: editing.city ?? "",
            state: editing.state ?? "",
            postal_code: editing.postal_code ?? "",
            latitude: String(editing.latitude ?? ""),
            longitude: String(editing.longitude ?? ""),
            is_default: Boolean(editing.is_default),
          }
        : EMPTY_ADDRESS,
    );
  }, [editing, reset]);

  const useCurrentLocation = () => {
    if (!currentLocation) {
      setFormError("Use current location first, or click the map to choose a pin.");
      return;
    }
    setValue("latitude", String(currentLocation.lat), { shouldValidate: true, shouldDirty: true });
    setValue("longitude", String(currentLocation.lng), { shouldValidate: true, shouldDirty: true });
    setFormError("");
  };

  const setPin = ({ latitude: nextLat, longitude: nextLng }) => {
    setValue("latitude", String(nextLat), { shouldValidate: true, shouldDirty: true });
    setValue("longitude", String(nextLng), { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values) => {
    setFormError("");
    try {
      const saved = await saveAddress.mutateAsync({ id: editing?.id, values });
      onDone(saved);
    } catch (error) {
      setFormError(friendlyAuthMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 grid gap-4 rounded-card border border-line bg-canvas p-4">
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label" required error={errors.label?.message}>
          {(field) => <TextInput {...field} {...register("label")} invalid={Boolean(errors.label)} />}
        </Field>
        <label className="flex items-end gap-2 pb-3 text-meta font-semibold text-ink-soft">
          <input type="checkbox" {...register("is_default")} className="size-4 accent-primary" />
          Default address
        </label>
      </div>

      <Field label="Address line 1" required error={errors.address_line_1?.message}>
        {(field) => <TextInput {...field} {...register("address_line_1")} invalid={Boolean(errors.address_line_1)} />}
      </Field>

      <Field label="Address line 2" error={errors.address_line_2?.message}>
        {(field) => <TextInput {...field} {...register("address_line_2")} invalid={Boolean(errors.address_line_2)} />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Locality" error={errors.locality?.message}>
          {(field) => <TextInput {...field} {...register("locality")} invalid={Boolean(errors.locality)} />}
        </Field>
        <Field label="City" error={errors.city?.message}>
          {(field) => <TextInput {...field} {...register("city")} invalid={Boolean(errors.city)} />}
        </Field>
        <Field label="State" error={errors.state?.message}>
          {(field) => <TextInput {...field} {...register("state")} invalid={Boolean(errors.state)} />}
        </Field>
        <Field label="Postal code" error={errors.postal_code?.message}>
          {(field) => <TextInput {...field} {...register("postal_code")} invalid={Boolean(errors.postal_code)} />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude" required error={errors.latitude?.message}>
          {(field) => (
            <TextInput
              {...field}
              {...register("latitude")}
              invalid={Boolean(errors.latitude)}
              inputMode="decimal"
              className="tabular-nums"
            />
          )}
        </Field>
        <Field label="Longitude" required error={errors.longitude?.message}>
          {(field) => (
            <TextInput
              {...field}
              {...register("longitude")}
              invalid={Boolean(errors.longitude)}
              inputMode="decimal"
              className="tabular-nums"
            />
          )}
        </Field>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta font-semibold text-ink-soft">Choose pin</p>
          <Button type="button" variant="secondary" size="sm" onClick={useCurrentLocation}>
            <LocateFixed className="size-4" aria-hidden="true" />
            Use current location
          </Button>
        </div>
        <MapPicker latitude={latitude} longitude={longitude} onPick={setPin} />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || saveAddress.isPending}>
          {isSubmitting || saveAddress.isPending ? "Saving..." : "Save address"}
        </Button>
      </div>
    </form>
  );
}

function AddressSection() {
  const addresses = useCustomerAddresses();
  const removeAddress = useDeleteCustomerAddress();
  const setDefault = useSetDefaultCustomerAddress();
  const { location, setLocation, detect, status } = useLocationStore();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const sorted = useMemo(
    () =>
      [...(addresses.data ?? [])].sort(
        (a, b) => Number(b.is_default) - Number(a.is_default) || a.label.localeCompare(b.label),
      ),
    [addresses.data],
  );

  const selectAddress = (address) => {
    setLocation(toActiveLocation(address));
    setMessage(`${address.label} is now your active location.`);
  };

  const handleDone = (address) => {
    setShowForm(false);
    setEditing(null);
    selectAddress(address);
    setMessage("Address saved.");
  };

  const deleteAddress = async (address) => {
    await removeAddress.mutateAsync(address.id);
    if (location?.addressId === address.id) {
      useLocationStore.getState().clear();
    }
  };

  return (
    <section className="rounded-panel border border-line bg-surface p-5 sm:p-6" aria-labelledby="addresses-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="addresses-heading" className="text-section text-ink">
            Saved addresses
          </h2>
          <p className="mt-1 text-meta text-ink-muted">
            Pick one as your active location for nearby prices and distances.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={detect} disabled={status === "locating"}>
            <LocateFixed className="size-4" aria-hidden="true" />
            {status === "locating" ? "Finding..." : "Use current"}
          </Button>
          <Button type="button" onClick={() => { setEditing(null); setShowForm(true); }}>
            Add address
          </Button>
        </div>
      </div>

      {message ? <Alert tone="success" className="mt-4">{message}</Alert> : null}
      {addresses.isError ? <Alert tone="error" className="mt-4">{friendlyAuthMessage(addresses.error)}</Alert> : null}

      {showForm ? (
        <AddressForm
          editing={editing}
          currentLocation={location}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onDone={handleDone}
        />
      ) : null}

      {addresses.isPending ? (
        <p className="mt-5 text-meta text-ink-muted">Loading addresses...</p>
      ) : sorted.length === 0 ? (
        <div className="mt-5 rounded-card border border-dashed border-line bg-canvas px-4 py-8 text-center">
          <Home className="mx-auto size-7 text-ink-muted" aria-hidden="true" />
          <p className="mt-3 text-card text-ink">No saved addresses yet</p>
          <p className="mt-1 text-meta text-ink-muted">
            Add one from your current location, manual details, or the map.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {sorted.map((address) => {
            const active = location?.addressId === address.id;
            return (
              <article
                key={address.id}
                className={`rounded-card border p-4 ${active ? "border-primary bg-primary-soft" : "border-line bg-canvas"}`}
              >
                <div className="flex gap-3">
                  <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface text-primary">
                    <MapPin className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-card text-ink">{address.label}</h3>
                      {address.is_default ? (
                        <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-accent-fg">
                          Default
                        </span>
                      ) : null}
                      {active ? (
                        <span className="rounded-pill bg-success-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-success">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-meta text-ink-soft">{addressSummary(address)}</p>
                    <p className="mt-1 text-meta tabular-nums text-ink-muted">
                      {Number(address.latitude).toFixed(5)}, {Number(address.longitude).toFixed(5)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => selectAddress(address)}>
                    <Check className="size-4" aria-hidden="true" />
                    Use
                  </Button>
                  {!address.is_default ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDefault.mutate(address.id)}>
                      <Star className="size-4" aria-hidden="true" />
                      Default
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditing(address); setShowForm(true); }}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => deleteAddress(address)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Account() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.isLoading) {
    return (
      <Container className="py-12">
        <p className="text-body text-ink-muted">Loading your account...</p>
      </Container>
    );
  }

  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: "/account" }} />;

  const signOut = async () => {
    await auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-heading text-ink">Account</h1>
          <p className="mt-2 max-w-2xl text-body text-ink-muted">
            Manage your customer profile and saved locations. Shopping and price comparison still work without signing in.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={signOut}>
          Sign out
        </Button>
      </div>

      <div className="mt-7 grid gap-6">
        <ProfileSection />
        <AddressSection />
      </div>

      <p className="mt-6 text-meta text-ink-muted">
        Want to browse instead?{" "}
        <Link to="/search" className="font-semibold text-primary hover:text-primary-hover">
          Search products
        </Link>
      </p>
    </Container>
  );
}
