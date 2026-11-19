// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pathname, push, refresh, signOut } = vi.hoisted(() => ({
  pathname: { value: "/workflows" },
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
  useRouter: () => ({ push, refresh }),
}));
vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({
      href,
      prefetch: _p,
      children,
      ...rest
    }: Record<string, unknown>) =>
      React.createElement("a", { href, ...rest }, children as React.ReactNode),
  };
});
vi.mock("next/image", async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) =>
      React.createElement("img", props),
  };
});
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut } }));

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
  });
};

beforeEach(() => {
  setViewport(1280);
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  // jsdom lacks ResizeObserver, which the mobile sheet (Radix) needs.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  vi.clearAllMocks();
  pathname.value = "/workflows";
});
afterEach(cleanup);

const renderShell = () =>
  render(
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main>page content</main>
      </SidebarInset>
    </SidebarProvider>,
  );

const link = (name: string) => screen.getByRole("link", { name });

describe("AppSidebar (T08)", () => {
  it("shows the brand logo linking to /", () => {
    renderShell();
    const brand = screen.getByRole("link", { name: /Nodebase/ });
    expect(brand.getAttribute("href")).toBe("/");
    expect(within(brand).getByAltText("Nodebase").getAttribute("src")).toBe(
      "/logo/logo.svg",
    );
  });

  it("has Workflows, Credentials and Executions links to the right routes", () => {
    renderShell();
    expect(link("Workflows").getAttribute("href")).toBe("/workflows");
    expect(link("Credentials").getAttribute("href")).toBe("/credentials");
    expect(link("Executions").getAttribute("href")).toBe("/executions");
  });

  it.each([
    ["/workflows", "Workflows"],
    ["/credentials", "Credentials"],
    ["/executions", "Executions"],
  ])("marks only the current section active (%s)", (path, active) => {
    pathname.value = path;
    renderShell();
    for (const name of ["Workflows", "Credentials", "Executions"]) {
      expect(link(name).getAttribute("data-active")).toBe(
        String(name === active),
      );
    }
  });

  it("keeps a section active on nested routes (/workflows/abc)", () => {
    pathname.value = "/workflows/abc";
    renderShell();
    expect(link("Workflows").getAttribute("data-active")).toBe("true");
    expect(link("Credentials").getAttribute("data-active")).toBe("false");
  });

  it("does not show billing items yet (planned for T11)", () => {
    renderShell();
    expect(screen.queryByText(/upgrade/i)).toBeNull();
    expect(screen.queryByText(/billing/i)).toBeNull();
  });

  it("Sign out calls authClient.signOut and, on success, goes to /login and refreshes", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();

    const { fetchOptions } = signOut.mock.calls[0][0];
    fetchOptions.onSuccess();
    expect(push).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalledOnce();
  });
});

describe("AppHeader + sidebar toggle (T08)", () => {
  it("renders the header with a sidebar trigger next to the page content", () => {
    renderShell();
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Toggle Sidebar" })).toBeTruthy();
    expect(screen.getByText("page content")).toBeTruthy();
  });

  it("desktop: the trigger collapses and expands the sidebar", () => {
    const { container } = renderShell();
    const sidebar = () => container.querySelector('[data-slot="sidebar"]');
    expect(sidebar()?.getAttribute("data-state")).toBe("expanded");

    fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(sidebar()?.getAttribute("data-state")).toBe("collapsed");
    expect(sidebar()?.getAttribute("data-collapsible")).toBe("icon");

    fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(sidebar()?.getAttribute("data-state")).toBe("expanded");
  });

  it("mobile: the sidebar is hidden until the trigger opens it as a sheet with the nav", async () => {
    setViewport(500);
    renderShell();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("link", { name: "Workflows" }),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("button", { name: "Sign out" }),
    ).toBeTruthy();
  });
});
