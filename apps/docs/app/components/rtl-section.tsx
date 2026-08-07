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
} from '@velobits-dev/ui';
import { PlusIcon } from '@velobits-dev/icons';

import { Demo } from '../section';

/*
 * Logical properties throughout (`ms-`/`me-`/`text-start`/`ps-`/`pe-`), so RTL
 * needs no per-component work and no `dir` variants. Extended past the original
 * Card to cover a composite, because Table and Breadcrumb are where a physical
 * property would actually show — a `text-left` header or a `pr-0` cell survives
 * every LTR review.
 *
 * Directional ICONS remain the caller's job: nothing here can know that a "next"
 * chevron should mirror while a "download" arrow should not.
 */
export function RtlDemo() {
  return (
    <Demo
      title="RTL"
      note='dir="rtl" on the wrapper, nothing else. Check that the badge sits at the inline end, the switch flips direction, the breadcrumb reads right-to-left and the table headers start at the correct edge.'
    >
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
    </Demo>
  );
}
