import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReservationsPanel from "../components/profile/ReservationsPanel";
import TicketsPanel from "../components/profile/TicketsPanel";
import { userService } from "../services/userService";
import {
  toChangePasswordRequestDto,
  toUpdateUserRequestDto,
} from "../dtos/userRequestDtos";
import ProfileDetailsForm from "../components/profile/ProfileDetailsForm";
import ChangePasswordForm from "../components/profile/ChangePasswordForm";

export function ProfilePage({
  token,
  activeTab = "details",
  onTabChange,
  onProfileUpdated,
  onBack,
}) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
  });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileMinHeight, setProfileMinHeight] = useState(null);
  const restoreScrollPosition = useRef(null);
  const changeProfileTab = (tab) => {
    restoreScrollPosition.current = window.scrollY;
    setProfileMinHeight(
      Math.max(
        document.documentElement.scrollHeight,
        window.scrollY + window.innerHeight,
      ),
    );
    onTabChange?.(tab);
  };
  useLayoutEffect(() => {
    if (restoreScrollPosition.current === null) return;

    const position = restoreScrollPosition.current;
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, position);
      restoreScrollPosition.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [activeTab]);
  useEffect(() => {
    userService
      .getMyProfile(token)
      .then((response) => response.json())
      .then((user) =>
        setForm({
          username: user.username,
          email: user.email,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
        }),
      );
  }, []);
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await userService.updateMyProfile(
        toUpdateUserRequestDto(form),
        token,
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(" ")
          : null;
        const serviceMessage =
          response.status === 401
            ? "Your session has expired. Please sign in again."
            : response.status >= 502
              ? "The Auth service is not running. Start it and try again."
              : null;
        setMessage({
          type: "error",
          text:
            payload.message ??
            validationMessage ??
            serviceMessage ??
            `Profile could not be updated (error ${response.status}).`,
        });
        return;
      }

      setForm({
        username: payload.username,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      });
      onProfileUpdated?.(payload);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch {
      setMessage({
        type: "error",
        text: "The Auth service is unavailable. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password must be different from the current password.",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await userService.changeMyPassword(
        toChangePasswordRequestDto(
          passwordForm.currentPassword,
          passwordForm.newPassword,
        ),
        token,
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const serviceMessage =
          response.status === 401
            ? "Your session has expired. Please sign in again."
            : response.status >= 502
              ? "The Auth service is not running. Start it and try again."
              : null;
        setPasswordMessage({
          type: "error",
          text:
            payload.message ??
            serviceMessage ??
            `Password could not be changed (error ${response.status}).`,
        });
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage({
        type: "success",
        text: "Password changed successfully.",
      });
    } catch {
      setPasswordMessage({
        type: "error",
        text: "The Auth service is unavailable. Please try again.",
      });
    } finally {
      setChangingPassword(false);
    }
  };
  return (
    <section className="management-page profile-page">
      <div className="management-heading">
        <div>
          <h1>My profile</h1>
        </div>
        <button className="header-link management-back-button" onClick={onBack}>
          ← Back to movies
        </button>
      </div>
      <div
        className="profile-tabs"
        role="tablist"
        aria-label="Profile sections"
      >
        <button
          className={activeTab === "details" ? "active" : ""}
          onClick={() => changeProfileTab("details")}
          role="tab"
        >
          Profile details
        </button>
        <button
          className={activeTab === "security" ? "active" : ""}
          onClick={() => changeProfileTab("security")}
          role="tab"
        >
          Security
        </button>
        <button
          className={activeTab === "reservations" ? "active" : ""}
          onClick={() => changeProfileTab("reservations")}
          role="tab"
        >
          My reservations
        </button>
        <button
          className={activeTab === "tickets" ? "active" : ""}
          onClick={() => changeProfileTab("tickets")}
          role="tab"
        >
          My tickets
        </button>
      </div>
      <div
        className="profile-layout"
        style={profileMinHeight ? { minHeight: profileMinHeight } : undefined}
      >
        {activeTab === "details" && (
          <ProfileDetailsForm
            form={form}
            setForm={setForm}
            message={message}
            saving={saving}
            onSubmit={save}
          />
        )}
        {activeTab === "security" && (
          <ChangePasswordForm
            form={passwordForm}
            setForm={setPasswordForm}
            message={passwordMessage}
            changing={changingPassword}
            onSubmit={changePassword}
          />
        )}
        {activeTab === "reservations" && <ReservationsPanel token={token} />}
        {activeTab === "tickets" && <TicketsPanel token={token} />}
      </div>
    </section>
  );
}
