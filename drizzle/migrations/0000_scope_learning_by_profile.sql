ALTER TABLE public.enrollments ADD COLUMN profile_role public.profile_role NOT NULL DEFAULT 'estudante';
ALTER TABLE public.certificates ADD COLUMN profile_role public.profile_role NOT NULL DEFAULT 'estudante';
UPDATE public.enrollments e SET profile_role = p.role FROM public.profiles p WHERE p.id = e.user_id AND p.role IS NOT NULL;
UPDATE public.certificates c SET profile_role = p.role FROM public.profiles p WHERE p.id = c.user_id AND p.role IS NOT NULL;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.profile_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'estudante'::public.profile_role) $$;

CREATE OR REPLACE FUNCTION public.set_learning_profile_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN
  NEW.profile_role := COALESCE((SELECT role FROM public.profiles WHERE id = NEW.user_id), 'estudante'::public.profile_role);
  RETURN NEW;
END; $$;

CREATE TRIGGER enrollments_profile_role BEFORE INSERT ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.set_learning_profile_role();
CREATE TRIGGER certificates_profile_role BEFORE INSERT ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.set_learning_profile_role();

ALTER TABLE public.enrollments DROP CONSTRAINT enrollments_user_id_course_id_key;
ALTER TABLE public.certificates DROP CONSTRAINT certificates_user_id_course_id_key;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_user_course_profile_key UNIQUE (user_id, course_id, profile_role);
ALTER TABLE public.certificates ADD CONSTRAINT certificates_user_course_profile_key UNIQUE (user_id, course_id, profile_role);

DROP POLICY enrollments_own ON public.enrollments;
CREATE POLICY enrollments_own ON public.enrollments FOR ALL TO authenticated
  USING (user_id = auth.uid() AND profile_role = public.current_profile_role())
  WITH CHECK (user_id = auth.uid() AND profile_role = public.current_profile_role());
DROP POLICY certificates_own ON public.certificates;
CREATE POLICY certificates_own ON public.certificates FOR ALL TO authenticated
  USING (user_id = auth.uid() AND profile_role = public.current_profile_role())
  WITH CHECK (user_id = auth.uid() AND profile_role = public.current_profile_role());