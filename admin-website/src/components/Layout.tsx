import type { ComponentChildren } from "preact";
import Sidebar from "@components/Sidebar";
import ToastContainer from "@components/Toast";

interface Props {
  children: ComponentChildren;
}

export default function Layout({ children }: Props) {
  return (
    <div class="min-h-screen">
      <Sidebar />
      <ToastContainer />
      <main class="ml-60 p-8">{children}</main>
    </div>
  );
}
