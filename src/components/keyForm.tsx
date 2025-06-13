"use client";
import { useIndexes } from "@/hooks/useIndexes";
import { useMeiliClient } from "@/hooks/useMeiliClient";
import { cn } from "@/lib/cn";
import { DatePicker, Input, Select } from "@douyinfe/semi-ui";
import { Button, Tooltip } from "@nextui-org/react";
import dayjs from "dayjs";
import _ from "lodash";
import type { KeyCreation } from "meilisearch";
import { type FC, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface Props {
	className?: string;
	data?: Required<KeyCreation>;
	type?: "create" | "edit";
	afterSubmit: () => void;
}

type KeyFormValue = KeyCreation &
	Partial<Pick<KeyCreation, "actions" | "indexes" | "expiresAt">>;

export const KeyForm: FC<Props> = ({
	className = "",
	type = "create",
	data,
	afterSubmit,
}) => {
	const { t } = useTranslation("key");
	const client = useMeiliClient();
	const [formType] = useState<"create" | "edit">(type);
	const [isSubmitLoading, setIsSubmitLoading] = useState(false);
	const [editing] = useState(data);
	// list as many as possible
	const [indexes] = useIndexes(client, { limit: 10000 });

	const form = useForm<KeyFormValue>({
		defaultValues: type === "edit" ? editing : {},
	});

	const onSubmit = useCallback(
		async (values: KeyFormValue) => {
			// loading
			setIsSubmitLoading(true);
			switch (formType) {
				case "create":
					await client.createKey({
						...values,
						uid: values.uid || undefined,
						indexes: _.isEmpty(values.indexes) ? ["*"] : values.indexes,
						actions: _.isEmpty(values.actions) ? ["*"] : values.actions,
						expiresAt: values.expiresAt || null,
					});
					break;
				case "edit":
					await client.updateKey(editing!.uid, {
						name: values.name,
						description: values.description,
					});
					break;
			}
			setIsSubmitLoading(false);
			afterSubmit();
		},
		[formType, afterSubmit, client, editing],
	);

	return (
		<div
			className={cn(
				className,
				"flex flex-col gap-y-6 w-full p-4 bg-white flex-1 rounded-t-6",
			)}
		>
			<p className={"text-center font-semibold text-lg"}>
				{t(`form.title.${formType}`)}
			</p>

			<Controller
				control={form.control}
				name="uid"
				rules={{
					required: false,
				}}
				render={({ field }) => (
					<label>
						UID
						<Input
							disabled={formType === "edit"}
							placeholder={t("form.uid.placeholder")}
							value={field.value}
							onChange={(str) => field.onChange(str)}
						/>
					</label>
				)}
			/>
			<Controller
				control={form.control}
				name="name"
				rules={{
					required: true,
				}}
				render={({ field }) => (
					<label>
						{t("name")}
						<Input
							placeholder={t("form.name.placeholder")}
							value={field.value}
							onChange={(str) => field.onChange(str)}
						/>
					</label>
				)}
			/>
			<Controller
				control={form.control}
				name="description"
				rules={{
					required: true,
				}}
				render={({ field }) => (
					<label>
						{t("description")}
						<Input
							placeholder={t("form.description.placeholder")}
							value={field.value}
							onChange={(str) => field.onChange(str)}
						/>
					</label>
				)}
			/>

			<Tooltip placement={"bottom-start"} content={t("form.indexes.tip")}>
				<Controller
					control={form.control}
					name="indexes"
					rules={{
						required: true,
					}}
					render={({ field }) => (
						<label>
							{t("props.indexes")}
							<Select
								disabled={formType === "edit"}
								className="w-full"
								multiple
								defaultValue={[]}
								value={field.value}
								onChange={(arr) => field.onChange(arr)}
								placeholder={t("form.indexes.placeholder")}
							>
								{indexes.map((index) => (
									<Select.Option value={index.uid} key={index.uid}>
										{index.uid}
									</Select.Option>
								))}
							</Select>
						</label>
					)}
				/>
			</Tooltip>
			<Tooltip placement={"bottom-start"} content={t("form.actions.tip")}>
				<Controller
					control={form.control}
					name="actions"
					rules={{
						required: true,
					}}
					render={({ field }) => (
						<label>
							{t("props.actions")}
							<Select
								disabled={formType === "edit"}
								className="w-full"
								multiple
								defaultValue={[]}
								value={field.value}
								onChange={(arr) => field.onChange(arr)}
								placeholder={t("form.actions.placeholder")}
							>
								{[
									{
										value: "search",
										label: "search",
									},
									{
										value: "documents.add",
										label: "documents.add",
									},
									{
										value: "documents.get",
										label: "documents.get",
									},
									{
										value: "documents.delete",
										label: "documents.delete",
									},
									{
										value: "indexes.create",
										label: "indexes.create",
									},
									{
										value: "indexes.get",
										label: "indexes.get",
									},
									{
										value: "indexes.update",
										label: "indexes.update",
									},
									{
										value: "indexes.delete",
										label: "indexes.delete",
									},
									{
										value: "tasks.get",
										label: "tasks.get",
									},
									{
										value: "settings.get",
										label: "settings.get",
									},
									{
										value: "settings.update",
										label: "settings.update",
									},
									{
										value: "stats.get",
										label: "stats.get",
									},
									{
										value: "dumps.create",
										label: "dumps.create",
									},
									{
										value: "version",
										label: "version",
									},
									{
										value: "keys.get",
										label: "keys.get",
									},
									{
										value: "keys.create",
										label: "keys.create",
									},
									{
										value: "keys.update",
										label: "keys.update",
									},
									{
										value: "keys.delete",
										label: "keys.delete",
									},
								].map((action) => (
									<Select.Option value={action.value} key={action.value}>
										{action.label}
									</Select.Option>
								))}
							</Select>
						</label>
					)}
				/>
			</Tooltip>

			<Tooltip placement={"bottom-start"} content={t("form.expiresAt.tip")}>
				<Controller
					control={form.control}
					name="expiresAt"
					rules={{
						validate: (value: Date | null) => {
							if (value && dayjs(value).isValid()) {
								return true;
							}
							form.setError("expiresAt", {
								message: t("form.expiresAt.invalid"),
							});
							return false;
						},
					}}
					render={({ field }) => (
						<label>
							{t("expired_at")}
							<DatePicker
								disabled={formType === "edit"}
								className="w-full"
								position="top"
								zIndex={5000}
								value={field.value ?? undefined}
								onChange={(dv, _dvs) => {
									if (dv) {
										form.setValue("expiresAt", dv as Date);
									} else {
										form.setValue("expiresAt", null);
									}
								}}
								type="dateTime"
								showClear
							/>
						</label>
					)}
				/>
			</Tooltip>
			<Button
				variant="solid"
				size="sm"
				color="primary"
				disabled={isSubmitLoading}
				onPress={() => {
					console.debug("onSubmit", form.getValues());
					onSubmit(form.getValues());
				}}
			>
				{t("common:submit")}
			</Button>
		</div>
	);
};