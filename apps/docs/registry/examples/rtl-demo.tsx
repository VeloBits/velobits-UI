'use client';

import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  StatusChip,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@velobitsdevs/ui';
import { PlusIcon } from '@velobitsdevs/icons';

/*
 * Logical properties throughout (`ms-`/`me-`/`text-start`/`ps-`/`pe-`), so RTL
 * needs no per-component work and no `dir` variants. This covers a composite as
 * well as a Card, because Table and Breadcrumb are where a physical property
 * would actually show — a `text-left` header or a `pr-0` cell survives every LTR
 * review.
 *
 * Directional ICONS remain the caller's job: nothing here can know that a "next"
 * chevron should mirror while a "download" arrow should not.
 */
export default function RtlDemo() {
  return (
    <div dir="rtl" className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">الرئيسية</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">الرايات</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>الدفع الجديد</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>لوحة التحكم</CardTitle>
          <CardDescription>١٢ راية مفعّلة</CardDescription>
          <CardAction>
            <Badge variant="success">مباشر</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Switch id="rtl-switch" defaultChecked />
          <Label htmlFor="rtl-switch">تشغيل تلقائي</Label>
          <Button variant="primary" size="sm" className="ms-auto">
            <PlusIcon />
            راية جديدة
          </Button>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المفتاح</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>البيئة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <code>new-checkout</code>
            </TableCell>
            <TableCell>
              <StatusChip status="partial">٤٠٪</StatusChip>
            </TableCell>
            <TableCell>الإنتاج</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <code>beta-search</code>
            </TableCell>
            <TableCell>
              <StatusChip status="pending" />
            </TableCell>
            <TableCell>التجريب</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
