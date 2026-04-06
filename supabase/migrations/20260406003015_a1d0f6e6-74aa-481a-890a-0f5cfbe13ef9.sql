
-- Attach the existing sync_match_perf_to_member function as a trigger on match_performances
-- Drop first in case it partially exists
DROP TRIGGER IF EXISTS trg_sync_match_perf ON public.match_performances;

CREATE TRIGGER trg_sync_match_perf
AFTER INSERT ON public.match_performances
FOR EACH ROW
EXECUTE FUNCTION public.sync_match_perf_to_member();
