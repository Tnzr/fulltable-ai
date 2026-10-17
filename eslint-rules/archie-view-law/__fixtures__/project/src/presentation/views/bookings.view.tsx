import type { BookingsVM } from "@/application/view-models/bookings.vm";

export function BookingsView(props: BookingsVM) {
  return <ul data-vid="1rqnjy5">{props.bookings.map((b) => <li data-vid="c12mein" key={b.id}>{b.status}</li>)}</ul>;
}
