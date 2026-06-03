import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { Discipline } from '@training-grounds/shared';
import type { AppDispatch, RootState } from '../../redux/store';
import { checkIn, type CheckInData } from '../../redux/slices/attendanceSlice';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import api from '../../services/api';

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  'bjj-gi': 'BJJ Gi',
  'bjj-nogi': 'BJJ No-Gi',
  'muay-thai': 'Muay Thai',
  wrestling: 'Wrestling',
  mma: 'MMA',
  boxing: 'Boxing',
  'open-mat': 'Open Mat',
};

const DISCIPLINE_COLORS: Record<string, string> = {
  'bjj-gi': '#4A90E2',
  'bjj-nogi': '#8B5CF6',
  'muay-thai': '#EF4444',
  wrestling: '#F59E0B',
  mma: '#10B981',
  boxing: '#EF4444',
  'open-mat': '#6B7280',
};

interface TodayClass {
  id: string;
  name: string;
  discipline: Discipline;
  startTime: string;
  durationMinutes: number;
  instructorName: string | null;
  level: string;
}

const formatTime = (time: string): string => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

type CheckInMode = 'classes' | 'scan' | 'confirm' | 'success';

export const CheckInScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isCheckingIn } = useSelector((state: RootState) => state.attendance);

  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<CheckInMode>('classes');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<TodayClass | null>(null);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheckedIn, setLastCheckedIn] = useState<{ className: string; xp: number } | null>(null);

  // Fetch today's classes from the real timetable
  useEffect(() => {
    const fetchTodayClasses = async () => {
      try {
        const dayOfWeek = new Date().getDay();
        const res = await api.get('/admin/classes');
        const allClasses = res.data.data || [];
        const classes = allClasses
          .filter((c: any) => c.dayOfWeek === dayOfWeek && c.isActive !== false)
          .sort((a: any, b: any) => (a.startTime || '').localeCompare(b.startTime || ''));
        setTodayClasses(classes);
      } catch {
        // If API fails, show empty state
        setTodayClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayClasses();
  }, []);

  const handleBarCodeScanned = (result: { data: string }) => {
    if (scannedData) return;
    setScannedData(result.data);
    setMode('confirm');
  };

  const handleSelectClass = (cls: TodayClass) => {
    setSelectedClass(cls);
    setMode('confirm');
  };

  const handleConfirmCheckIn = async () => {
    const classId = selectedClass?.id ?? scannedData;
    if (!classId) return;

    const checkInData: CheckInData = {
      classId,
      className: selectedClass?.name ?? 'QR Check-in',
      discipline: selectedClass?.discipline ?? 'mma',
    };

    try {
      const result = await dispatch(checkIn(checkInData)).unwrap();
      setLastCheckedIn({
        className: selectedClass?.name ?? 'Class',
        xp: (result as any)?.xpEarned ?? 50,
      });
      setMode('success');
    } catch {
      Alert.alert('Check-in Failed', 'Please try again or select a different class.');
    }
  };

  const handleReset = () => {
    setMode('classes');
    setScannedData(null);
    setSelectedClass(null);
    setLastCheckedIn(null);
  };

  // ─── Success Screen ───
  if (mode === 'success' && lastCheckedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={48} color={colors.charcoal} />
          </View>
          <Text style={styles.successTitle}>CHECKED IN!</Text>
          <Text style={styles.successClass}>{lastCheckedIn.className}</Text>
          <View style={styles.successXpBadge}>
            <Text style={styles.successXpText}>+{lastCheckedIn.xp} XP</Text>
          </View>
          <Text style={styles.successMotivation}>Keep grinding!</Text>

          <Pressable
            style={({ pressed }) => [styles.doneButton, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleReset}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Confirm Screen ───
  if (mode === 'confirm') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmContainer}>
          <Pressable onPress={() => setMode(selectedClass ? 'classes' : 'scan')} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color={colors.warmAccent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.confirmContent}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.confirmTitle}>CONFIRM CHECK-IN</Text>

            {selectedClass ? (
              <Card style={styles.confirmCard}>
                <Text style={styles.confirmClassName}>{selectedClass.name}</Text>
                <Text style={styles.confirmDiscipline}>
                  {DISCIPLINE_LABELS[selectedClass.discipline]}
                </Text>
                {selectedClass.instructorName && (
                  <Text style={styles.confirmInstructor}>
                    with {selectedClass.instructorName}
                  </Text>
                )}
                {selectedClass.startTime && (
                  <Text style={styles.confirmTime}>
                    {formatTime(selectedClass.startTime)} · {selectedClass.durationMinutes} min
                  </Text>
                )}
              </Card>
            ) : (
              <Card style={styles.confirmCard}>
                <Text style={styles.confirmClassName}>QR Code Scanned</Text>
                <Text style={styles.confirmDiscipline}>Class detected</Text>
              </Card>
            )}

            <Button
              title="Confirm Check-In"
              onPress={handleConfirmCheckIn}
              isLoading={isCheckingIn}
              variant="primary"
              style={styles.confirmButton}
            />

            <Pressable onPress={handleReset}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── QR Scanner ───
  if (mode === 'scan') {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionContainer}>
            <Pressable onPress={() => setMode('classes')} style={styles.backRow}>
              <Ionicons name="arrow-back" size={20} color={colors.warmAccent} />
              <Text style={styles.backText}>Back to classes</Text>
            </Pressable>
            <Ionicons name="camera-outline" size={48} color={colors.warmAccent} />
            <Text style={styles.permissionTitle}>Camera Access</Text>
            <Text style={styles.permissionText}>
              We need camera access to scan the class QR code.
            </Text>
            <Button
              title="Grant Permission"
              onPress={requestPermission}
              variant="primary"
              style={styles.permissionButton}
            />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Pressable onPress={() => setMode('classes')} style={styles.backRow}>
              <Ionicons name="arrow-back" size={20} color={colors.warmAccent} />
              <Text style={styles.backText}>Back to classes</Text>
            </Pressable>
          </View>

          <View style={styles.cameraWrapper}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarCodeScanned}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scanText}>Point at class QR code</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Today's Classes (default view) ───
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.classesContent}>
        {/* QR Scan Button */}
        <Pressable
          style={({ pressed }) => [styles.qrButton, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => setMode('scan')}
        >
          <Ionicons name="qr-code" size={22} color={colors.charcoal} />
          <Text style={styles.qrButtonText}>SCAN QR CODE</Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or select a class</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Today's Classes */}
        <Text style={styles.todayLabel}>
          TODAY'S CLASSES · {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.warmAccent} style={{ marginTop: spacing.xl }} />
        ) : todayClasses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color={colors.steel} />
            <Text style={styles.emptyTitle}>No classes today</Text>
            <Text style={styles.emptyText}>Check back tomorrow or scan a QR code to check in.</Text>
          </Card>
        ) : (
          todayClasses.map((cls) => {
            const discColor = DISCIPLINE_COLORS[cls.discipline] || colors.warmAccent;
            return (
              <Pressable
                key={cls.id}
                onPress={() => handleSelectClass(cls)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <Card style={styles.classCard}>
                  <View style={styles.classRow}>
                    <View style={[styles.classAccent, { backgroundColor: discColor }]} />
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>{cls.name}</Text>
                      <View style={styles.classDetails}>
                        <Text style={[styles.classDiscipline, { color: discColor }]}>
                          {DISCIPLINE_LABELS[cls.discipline]}
                        </Text>
                        {cls.instructorName && (
                          <>
                            <Text style={styles.classDot}>·</Text>
                            <Text style={styles.classInstructor}>{cls.instructorName}</Text>
                          </>
                        )}
                      </View>
                      <View style={styles.classFooter}>
                        {cls.startTime && (
                          <Text style={styles.classTime}>
                            {formatTime(cls.startTime)} · {cls.durationMinutes} min
                          </Text>
                        )}
                        {cls.level && (
                          <Text style={styles.classLevel}>{cls.level}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.steel} />
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
  classesContent: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },

  // QR Button
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmAccent,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  qrButtonText: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.md,
    color: colors.charcoal,
    letterSpacing: fonts.letterSpacing.wide * 18,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderDark,
  },
  dividerText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.wider * 11,
  },

  // Today label
  todayLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.semibold,
    color: colors.steel,
    letterSpacing: fonts.letterSpacing.widest * 11,
    marginBottom: spacing.md,
  },

  // Class Cards
  classCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  classAccent: {
    width: 4,
    height: 48,
    borderRadius: 2,
  },
  classInfo: {
    flex: 1,
    gap: 3,
  },
  className: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    fontWeight: fonts.weight.semibold,
    color: colors.offWhite,
  },
  classDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  classDiscipline: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
  },
  classDot: {
    color: colors.steel,
    fontSize: fonts.size.sm,
  },
  classInstructor: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  classTime: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.textMuted,
  },
  classLevel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.widest * 11,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing['2xl'],
  },
  emptyTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.xl,
    color: colors.offWhite,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
    textAlign: 'center',
  },

  // Back row
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.base,
  },
  backText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.warmAccent,
  },

  // Scanner
  scannerContainer: {
    flex: 1,
  },
  scannerHeader: {
    padding: spacing.base,
  },
  cameraWrapper: {
    flex: 1,
    margin: spacing.base,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanFrame: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  scanText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.offWhite,
    marginTop: spacing.lg,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.warmAccent,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },

  // Permission
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.base,
  },
  permissionTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['2xl'],
    color: colors.offWhite,
  },
  permissionText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.steel,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    width: '100%',
    marginTop: spacing.md,
  },

  // Confirm
  confirmContainer: {
    flex: 1,
    padding: spacing.base,
  },
  confirmContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  confirmTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['2xl'],
    color: colors.offWhite,
    letterSpacing: fonts.letterSpacing.wide * 32,
  },
  confirmCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  confirmClassName: {
    fontFamily: 'Inter',
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.bold,
    color: colors.offWhite,
  },
  confirmDiscipline: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.warmAccent,
  },
  confirmInstructor: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
  },
  confirmTime: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.textMuted,
  },
  confirmButton: {
    width: '100%',
  },
  cancelText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.steel,
    marginTop: spacing.md,
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['3xl'],
    color: colors.success,
    letterSpacing: fonts.letterSpacing.wide * 40,
  },
  successClass: {
    fontFamily: 'Inter',
    fontSize: fonts.size.lg,
    color: colors.offWhite,
  },
  successXpBadge: {
    backgroundColor: 'rgba(201, 168, 124, 0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  successXpText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.bold,
    color: colors.warmAccent,
  },
  successMotivation: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
    fontStyle: 'italic',
  },
  doneButton: {
    backgroundColor: colors.warmAccent,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing['3xl'],
    marginTop: spacing.xl,
  },
  doneButtonText: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.lg,
    color: colors.charcoal,
    letterSpacing: fonts.letterSpacing.wide * 20,
  },
});
